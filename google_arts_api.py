#!/usr/bin/env python3
"""
Google Arts & Culture 搜索 API — 通用方法
==========================================

直接调用 search(query, page) 即可获取数据。

示例:
    from google_arts_api import search

    # 搜索第1页
    data = search("impressionism")
    print(data["total"])       # 总结果数
    print(len(data["list"]))   # 本页条数
    for item in data["list"]:
        print(item["title"], item["artist"], item["thumbnail"])

    # 搜索第2页
    data = search("monet", page=2)

    # 同时获取多页
    all_data = search_all("van gogh", max_pages=3)
"""

import json
import subprocess
import urllib.parse

USER_AGENT = (
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
    "AppleWebKit/537.36 (KHTML, like Gecko) "
    "Chrome/120.0.0.0 Safari/537.36"
)

API_URL = "https://artsandculture.google.com/api/search"


def search(query: str, page: int = 1) -> dict:
    """
    搜索 Google Arts & Culture 艺术资源

    Args:
        query: 搜索关键词（英文效果更佳）
        page:  页码，从 1 开始（每页约 60 条）

    Returns:
        {
            "query": "搜索词",
            "page": 1,
            "total": 1594,          # 总结果数
            "list": [               # 本页资源列表
                {
                    "id": "xxx",
                    "title": "作品名",
                    "artist": "艺术家",
                    "thumbnail": "https://...",   # 缩略图URL
                    "url": "https://artsandculture.google.com/...",
                    "color": "#8aa080",           # 主色调
                    "aspect_ratio": 1.49,         # 宽高比
                    "has_pixels": False,          # 是否支持缩放
                    "institution": "博物馆名",
                    "pixel_data": null            # 像素坐标数据
                },
                ...
            ]
        }
    """
    cursor = None

    # 翻页到目标页
    for _ in range(page - 1):
        result = _fetch_page(query, cursor)
        cursor = result["next_cursor"]
        if not cursor:
            # 没有更多页了，返回空
            return {
                "query": query,
                "page": page,
                "total": result["total"],
                "list": [],
            }

    return _fetch_page(query, cursor, page=page)


def search_all(query: str, max_pages: int = 5) -> list:
    """
    自动翻页，获取多页全部结果

    Args:
        query: 搜索关键词
        max_pages: 最大翻页数

    Returns:
        所有资源的一维列表
    """
    all_items = []
    cursor = None

    for page_num in range(1, max_pages + 1):
        result = _fetch_page(query, cursor)
        all_items.extend(result["list"])
        print(f"  第 {page_num} 页: +{len(result['list'])} 条, 累计 {len(all_items)}/{result['total']}")

        cursor = result["next_cursor"]
        if not cursor:
            break

    return all_items


def _fetch_page(query: str, cursor: str = None, page: int = 1) -> dict:
    """内部方法：请求一页数据"""
    params = {"q": query, "hl": "en"}
    if cursor:
        params["cursor"] = cursor

    url = f"{API_URL}?{urllib.parse.urlencode(params)}"

    cmd = [
        "curl", "-s", "-L", url,
        "-H", f"User-Agent: {USER_AGENT}",
        "-H", "Accept: application/json, text/plain, */*",
        "-H", "Accept-Language: en-US,en;q=0.9",
        "-H", "Referer: https://artsandculture.google.com/",
    ]
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)
    raw = result.stdout

    # 去除 XSS 防护前缀
    if raw.startswith(")]}'"):
        raw = raw[4:].lstrip("\n")

    data = json.loads(raw)
    return _parse(data, query, page)


def _parse(data: list, query: str, page: int) -> dict:
    """内部方法：解析 API 响应"""
    inner = data[0]
    section = inner[3]
    assets_raw = section[2]
    total = section[4]
    next_cursor = section[8]

    items = []
    for asset in assets_raw:
        info = asset[10] if len(asset) > 10 and isinstance(asset[10], list) else []
        items.append({
            "id": info[0] if len(info) > 0 else None,
            "title": asset[1] if len(asset) > 1 else None,
            "artist": asset[2] if len(asset) > 2 else None,
            "thumbnail": f"https:{asset[3]}" if len(asset) > 3 and asset[3] else None,
            "url": f"https://artsandculture.google.com{asset[4]}" if len(asset) > 4 and asset[4] else None,
            "color": asset[8] if len(asset) > 8 else None,
            "aspect_ratio": info[1] if len(info) > 1 else None,
            "pixel_data": info[9] if len(info) > 9 else None,
            "has_pixels": info[10] if len(info) > 10 else False,
            "institution": info[12] if len(info) > 12 else None,
        })

    return {
        "query": query,
        "page": page,
        "total": total,
        "list": items,
        "next_cursor": next_cursor if next_cursor else None,
    }


# ─── 命令行入口 ───────────────────────────────────────────
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Google Arts & Culture 搜索")
    parser.add_argument("query", help="搜索关键词")
    parser.add_argument("--page", "-p", type=int, default=1, help="页码 (默认 1)")
    parser.add_argument("--all", action="store_true", help="自动翻页获取全部")
    parser.add_argument("--pages", type=int, default=5, help="最大翻页数 (默认 5)")
    parser.add_argument("--json", action="store_true", help="输出 JSON")

    args = parser.parse_args()

    if args.all:
        items = search_all(args.query, max_pages=args.pages)
        if args.json:
            print(json.dumps(items, ensure_ascii=False, indent=2))
        else:
            for i, item in enumerate(items):
                print(f"[{i+1}] {item['title']} - {item['artist']} ({item['institution']})")
    else:
        result = search(args.query, page=args.page)
        if args.json:
            # 输出时去掉内部字段 next_cursor
            out = {k: v for k, v in result.items() if k != "next_cursor"}
            print(json.dumps(out, ensure_ascii=False, indent=2))
        else:
            print(f"搜索: \"{result['query']}\" | 第 {result['page']} 页 | 共 {result['total']} 条")
            print("=" * 60)
            for i, item in enumerate(result["list"]):
                print(f"\n[{i+1}] {item['title']}")
                print(f"    艺术家: {item['artist']}")
                print(f"    机构:   {item['institution']}")
                print(f"    缩略图: {item['thumbnail']}")
                print(f"    链接:   {item['url']}")
