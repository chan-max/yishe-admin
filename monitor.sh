#!/bin/bash
# 字体和PSD模板处理监控脚本
# 如果脚本停止，自动重启

SCRIPT_NAME="batch-complete-all.mjs"
LOG_FILE="batch-complete-all.log"
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6NSwiYWNjb3VudCI6ImphY2tpZSIsInRlcm1pbmFsVHlwZSI6ImFkbWluIiwidG9rZW5JZCI6Ijc2ZDUzN2E0LTFiYTQtNGFhNS04OTU3LTA3MjI3NTA3MjE5NCIsImlhdCI6MTc4NTQ5MDAxNCwiZXhwIjoyMTAxMDY2MDE0fQ.2ZtokckzvlrQQwBQryeAGkrnnWUVXZQwb6DvYFZq3D4"

check_and_restart() {
    # 检查服务
    if ! curl -s --max-time 5 http://localhost:1520/api/font-template/completion-stats -H "Authorization: Bearer $TOKEN" > /dev/null 2>&1; then
        echo "[$(date)] ⚠️ 服务异常，等待恢复..."
        return 1
    fi

    # 检查脚本是否在运行
    if ! pgrep -f "$SCRIPT_NAME" > /dev/null; then
        echo "[$(date)] 🔄 脚本未运行，正在重启..."
        nohup node $SCRIPT_NAME all 1 2 >> $LOG_FILE 2>&1 &
        echo "[$(date)] ✅ 脚本已重启，PID: $!"
        return 0
    fi
    
    return 0
}

# 显示当前进度
show_progress() {
    echo "=== $(date '+%Y-%m-%d %H:%M:%S') ==="
    python3 -c "
import json
try:
    with open('.font-complete-checkpoint.json') as f:
        data = json.load(f)
    count = len(data.get('processedIds', []))
    print(f'字体: {count} / 18213 ({count/18213*100:.1f}%)')
except: print('字体: 0')

try:
    with open('.psd-complete-checkpoint.json') as f:
        data = json.load(f)
    count = len(data.get('processedIds', []))
    print(f'PSD模板: {count} / 445 ({count/445*100:.1f}%)')
except: print('PSD模板: 0')
"
    pgrep -f "$SCRIPT_NAME" > /dev/null && echo "状态: ✅ 运行中" || echo "状态: ❌ 需要重启"
}

# 主循环
echo "🚀 启动监控..."
while true; do
    check_and_restart
    show_progress
    sleep 60  # 每分钟检查一次
done
