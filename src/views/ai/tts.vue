<template>
  <div class="tts-page">
    <div class="list-page-layout">
      <div class="filter-section">
        <div class="search-bar">
          <div class="search-form-container">
            <div class="search-field search-field-wide">
              <label class="search-label">搜索</label>
              <el-input
                v-model="queryParams.search"
                placeholder="文案 / 返回URL"
                clearable
                @keyup.enter="getList"
                @clear="getList"
              />
            </div>
            <div class="search-field search-field-actions">
              <label class="search-label"></label>
              <div class="search-actions">
                <el-button type="primary" @click="getList">搜索</el-button>
                <el-button 
                  type="danger" 
                  :icon="Delete" 
                  :disabled="selectedRows.length === 0"
                  @click="handleBatchDelete"
                >
                  批量删除({{ selectedRows.length }})
                </el-button>
                <el-button type="primary" :icon="Plus" @click="handleAdd">创建</el-button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div class="content-container">
        <div class="table-section">
          <div class="common-table">
            <vxe-grid 
              v-bind="gridOptions" 
              :data="dataSource" 
              :loading="loading"
              @checkbox-change="handleCheckboxChange"
              @checkbox-all="handleCheckboxAll"
            >
            <template #textSlot="{ row }">
              <div class="clamp-3">{{ row.text || '-' }}</div>
            </template>
            <template #configSlot="{ row }">
              <div class="config-cell">{{ formatConfig(row.configParams) }}</div>
            </template>
            <template #previewSlot="{ row }">
              <audio v-if="row.resultUrl" :src="row.resultUrl" controls preload="none" class="audio-preview" />
              <span v-else>-</span>
            </template>
            <template #statusSlot="{ row }">
              <el-tag :type="row.status === 'success' ? 'success' : 'danger'">
                {{ row.status === 'success' ? '成功' : '失败' }}
              </el-tag>
            </template>
            <template #operationSlot="{ row }">
              <el-button type="danger" link @click="handleDelete(row)">删除</el-button>
            </template>
            </vxe-grid>
          </div>
        </div>

        <div class="pagination-section">
          <pagination
            :total="total"
            v-model:page="queryParams.page"
            v-model:limit="queryParams.pageSize"
            @pagination="getList"
          />
        </div>
      </div>
    </div>

    <el-dialog v-model="dialogVisible" :title="dialogTitle" fullscreen class="tts-create-dialog" :destroy-on-close="true">
      <div class="tts-create-body">
        <el-form ref="formRef" :model="form" :rules="rules" label-width="96px">
          <el-form-item label="文案" prop="text">
            <el-input v-model="form.text" type="textarea" :rows="6" maxlength="1000" show-word-limit />
          </el-form-item>

          <el-form-item v-if="isInstructModel" label="指令模板">
            <el-select
              v-model="selectedInstructionTemplate"
              class="w-full"
              placeholder="选择模板后会自动填入指令"
              @change="applyInstructionTemplate"
            >
              <el-option
                v-for="item in instructionTemplates"
                :key="item.label"
                :label="item.label"
                :value="item.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item v-if="isInstructModel" label="指令控制" prop="instructions">
            <el-input
              v-model="form.instructions"
              type="textarea"
              :rows="5"
              maxlength="1600"
              show-word-limit
              placeholder="示例：语速较快，带有明显的上扬语调，适合介绍时尚产品"
            />
            <div class="instruction-tip">
              仅支持 qwen3-tts-instruct-flash，指令文本仅支持中文/英文，建议描述音调、语速、情感等特征。
            </div>
          </el-form-item>

          <!-- 声音复刻模型的音色选择 -->
          <el-form-item v-if="isVoiceCloneModel" label="音色来源" required>
            <el-radio-group v-model="voiceSource">
              <el-radio value="existing">选择已有音色</el-radio>
              <el-radio value="upload">上传新音频</el-radio>
            </el-radio-group>
          </el-form-item>

          <!-- 选择已有音色 -->
          <el-form-item v-if="isVoiceCloneModel && voiceSource === 'existing'" label="选择音色" required>
            <div class="voice-list-container">
              <div class="voice-list-header">
                <span>已创建音色列表</span>
                <el-button 
                  :icon="Refresh" 
                  size="small" 
                  :loading="loadingVoices" 
                  @click="loadCustomVoices"
                >
                  刷新
                </el-button>
              </div>
              <el-select 
                v-model="form.voice" 
                class="w-full" 
                placeholder="请选择音色" 
                :loading="loadingVoices"
                clearable
                @change="handleVoiceSelect"
                @clear="customVoiceInfo = null"
              >
                <el-option
                  v-for="item in customVoiceList"
                  :key="item.voice"
                  :label="`${formatVoiceName(item)} (${new Date(item.gmt_create).toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })})`"
                  :value="item.voice"
                >
                  <div class="voice-option">
                    <span :title="item.voice">{{ formatVoiceName(item) }}</span>
                    <el-button
                      :icon="Delete"
                      size="small"
                      type="danger"
                      text
                      @click.stop="handleDeleteVoice(item.voice)"
                    />
                  </div>
                </el-option>
              </el-select>
              <div v-if="customVoiceList.length === 0 && !loadingVoices" class="voice-empty">
                暂无已创建音色，请上传音频创建
              </div>
            </div>
          </el-form-item>

          <!-- 上传新音频 -->
          <el-form-item v-if="isVoiceCloneModel && voiceSource === 'upload'" label="音色名称">
            <el-input 
              v-model="customVoiceName" 
              placeholder="请输入音色名称（可选，留空则使用文件名）" 
              :disabled="uploadingAudio"
              clearable
              maxlength="32"
              show-word-limit
            />
            <div class="voice-name-tip">
              仅支持字母、数字、下划线、横线，不能以数字开头，最多32个字符
            </div>
          </el-form-item>

          <el-form-item v-if="isVoiceCloneModel && voiceSource === 'upload'" label="音频上传" required>
            <el-upload
              class="audio-upload"
              :auto-upload="false"
              :on-change="handleAudioChange"
              :limit="1"
              :accept="'audio/*'"
              :disabled="uploadingAudio"
              drag
            >
              <div class="upload-content" v-loading="uploadingAudio">
                <el-icon class="upload-icon"><Upload /></el-icon>
                <div class="upload-text">
                  <p>{{ uploadingAudio ? '正在创建音色...' : '点击或拖拽音频文件到此处' }}</p>
                  <p class="upload-tip">支持 mp3/wav 格式，建议 3-10s 清晰声音</p>
                </div>
              </div>
            </el-upload>
            <div v-if="customVoiceInfo" class="voice-info">
              <el-alert type="success" :closable="false">
                <template #title>
                  <span>已创建音色：{{ customVoiceInfo.preferredName }}</span>
                </template>
              </el-alert>
            </div>
            <div v-if="!customVoiceInfo && form.model === 'qwen3-tts-vc-2026-01-22'" class="voice-tip">
              请先上传音频文件创建自定义音色，然后才能生成语音
            </div>
          </el-form-item>

          <el-row :gutter="16">
            <el-col :xs="24" :md="12">
              <el-form-item v-if="!isVoiceCloneModel" label="音色" prop="voice">
                <el-select v-model="form.voice" class="w-full">
                  <el-option label="Cherry（音色名：芊悦｜描述：阳光积极、亲切自然小姐姐（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Cherry" />
                  <el-option label="Serena（音色名：苏瑶｜描述：温柔小姐姐（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Serena" />
                  <el-option label="Ethan（音色名：晨煦｜描述：标准普通话，带部分北方口音。阳光、温暖、活力、朝气（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Ethan" />
                  <el-option label="Chelsie（音色名：千雪｜描述：二次元虚拟女友（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Chelsie" />
                  <el-option label="Momo（音色名：茉兔｜描述：撒娇搞怪，逗你开心（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Momo" />
                  <el-option label="Vivian（音色名：十三｜描述：拽拽的、可爱的小暴躁（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Vivian" />
                  <el-option label="Moon（音色名：月白｜描述：率性帅气的月白（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Moon" />
                  <el-option label="Maia（音色名：四月｜描述：知性与温柔的碰撞（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Maia" />
                  <el-option label="Kai（音色名：凯｜描述：耳朵的一场SPA（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Kai" />
                  <el-option label="Nofish（音色名：不吃鱼｜描述：不会翘舌音的设计师（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Nofish" />
                  <el-option label="Bella（音色名：萌宝｜描述：喝酒不打醉拳的小萝莉（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Bella" />
                  <el-option label="Jennifer（音色名：詹妮弗｜描述：品牌级、电影质感般美语女声（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Jennifer" />
                  <el-option label="Ryan（音色名：甜茶｜描述：节奏拉满，戏感炸裂，真实与张力共舞（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Ryan" />
                  <el-option label="Katerina（音色名：卡捷琳娜｜描述：御姐音色，韵律回味十足（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Katerina" />
                  <el-option label="Aiden（音色名：艾登｜描述：精通厨艺的美语大男孩（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Aiden" />
                  <el-option label="Eldric Sage（音色名：沧明子｜描述：沉稳睿智的老者，沧桑如松却心明如镜（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Eldric Sage" />
                  <el-option label="Mia（音色名：乖小妹｜描述：温顺如春水，乖巧如初雪（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Mia" />
                  <el-option label="Mochi（音色名：沙小弥｜描述：聪明伶俐的小大人，童真未泯却早慧如禅（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Mochi" />
                  <el-option label="Bellona（音色名：燕铮莺｜描述：声音洪亮，吐字清晰，人物鲜活，听得人热血沸腾；金戈铁马入梦来，字正腔圆间尽显千面人声的江湖（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Bellona" />
                  <el-option label="Vincent（音色名：田叔｜描述：一口独特的沙哑烟嗓，一开口便道尽了千军万马与江湖豪情（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Vincent" />
                  <el-option label="Bunny（音色名：萌小姬｜描述：“萌属性”爆棚的小萝莉（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Bunny" />
                  <el-option label="Neil（音色名：阿闻｜描述：平直的基线语调，字正腔圆的咬字发音，这就是最专业的新闻主持人（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Neil" />
                  <el-option label="Elias（音色名：墨讲师｜描述：既保持学科严谨性，又通过叙事技巧将复杂知识转化为可消化的认知模块（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Elias" />
                  <el-option label="Arthur（音色名：徐大爷｜描述：被岁月和旱烟浸泡过的质朴嗓音，不疾不徐地摇开了满村的奇闻异事（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Arthur" />
                  <el-option label="Nini（音色名：邻家妹妹｜描述：糯米糍一样又软又黏的嗓音，那一声声拉长了的“哥哥”，甜得能把人的骨头都叫酥了（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Nini" />
                  <el-option label="Ebona（音色名：诡婆婆｜描述：她的低语像一把生锈的钥匙，缓慢转动你内心最深处的幽暗角落——那里藏着所有你不敢承认的童年阴影与未知恐惧（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Ebona" />
                  <el-option label="Seren（音色名：小婉｜描述：温和舒缓的声线，助你更快地进入睡眠，晚安，好梦（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Seren" />
                  <el-option label="Pip（音色名：顽屁小孩｜描述：调皮捣蛋却充满童真的他来了，这是你记忆中的小新吗（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Pip" />
                  <el-option label="Stella（音色名：少女阿月｜描述：平时是甜到发腻的迷糊少女音，但在喊出“代表月亮消灭你”时，瞬间充满不容置疑的爱与正义（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Stella" />
                  <el-option label="Bodega（音色名：博德加｜描述：热情的西班牙大叔（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Bodega" />
                  <el-option label="Sonrisa（音色名：索尼莎｜描述：热情开朗的拉美大姐（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Sonrisa" />
                  <el-option label="Alek（音色名：阿列克｜描述：一开口，是战斗民族的冷，也是毛呢大衣下的暖（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Alek" />
                  <el-option label="Dolce（音色名：多尔切｜描述：慵懒的意大利大叔（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Dolce" />
                  <el-option label="Sohee（音色名：素熙｜描述：温柔开朗，情绪丰富的韩国欧尼（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Sohee" />
                  <el-option label="Ono Anna（音色名：小野杏｜描述：鬼灵精怪的青梅竹马（女性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Ono Anna" />
                  <el-option label="Lenn（音色名：莱恩｜描述：理性是底色，叛逆藏在细节里——穿西装也听后朋克的德国青年（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Lenn" />
                  <el-option label="Emilien（音色名：埃米尔安｜描述：浪漫的法国大哥哥（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Emilien" />
                  <el-option label="Andre（音色名：安德雷｜描述：声音磁性，自然舒服、沉稳男生（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Andre" />
                  <el-option label="Radio Gol（音色名：拉迪奥·戈尔｜描述：足球诗人Rádio Gol！今天我要用名字为你们解说足球（男性）｜支持语种：中文（普通话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Radio Gol" />
                  <el-option label="Jada（音色名：上海-阿珍｜描述：风风火火的沪上阿姐（女性）｜支持语种：中文（上海话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Jada" />
                  <el-option label="Dylan（音色名：北京-晓东｜描述：北京胡同里长大的少年（男性）｜支持语种：中文（北京话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Dylan" />
                  <el-option label="Li（音色名：南京-老李｜描述：耐心的瑜伽老师（男性）｜支持语种：中文（南京话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Li" />
                  <el-option label="Marcus（音色名：陕西-秦川｜描述：面宽话短，心实声沉——老陕的味道（男性）｜支持语种：中文（陕西话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Marcus" />
                  <el-option label="Roy（音色名：闽南-阿杰｜描述：诙谐直爽、市井活泼的台湾哥仔形象（男性）｜支持语种：中文（闽南语）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Roy" />
                  <el-option label="Peter（音色名：天津-李彼得｜描述：天津相声，专业捧哏（男性）｜支持语种：中文（天津话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Peter" />
                  <el-option label="Sunny（音色名：四川-晴儿｜描述：甜到你心里的川妹子（女性）｜支持语种：中文（四川话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Sunny" />
                  <el-option label="Eric（音色名：四川-程川｜描述：一个跳脱市井的四川成都男子（男性）｜支持语种：中文（四川话）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Eric" />
                  <el-option label="Rocky（音色名：粤语-阿强｜描述：幽默风趣的阿强，在线陪聊（男性）｜支持语种：中文（粤语）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Rocky" />
                  <el-option label="Kiki（音色名：粤语-阿清｜描述：甜美的港妹闺蜜（女性）｜支持语种：中文（粤语）、英语、法语、德语、俄语、意大利语、西班牙语、葡萄牙语、日语、韩语）" value="Kiki" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="12">
              <el-form-item label="模型" prop="model">
                <el-select v-model="form.model" class="w-full">
                  <el-option label="qwen3-tts-flash【快速】" value="qwen3-tts-flash" />
                  <el-option label="qwen3-tts-instruct-flash【指令控制】" value="qwen3-tts-instruct-flash" />
                  <el-option label="qwen3-tts-vc-2026-01-22【声音复刻】" value="qwen3-tts-vc-2026-01-22" />
                </el-select>
              </el-form-item>
            </el-col>
          </el-row>

          <el-row :gutter="16">
            <el-col :xs="24" :md="8">
              <el-form-item label="格式" prop="format">
                <el-select v-model="form.format" class="w-full">
                  <el-option label="mp3" value="mp3" />
                  <el-option label="wav" value="wav" />
                </el-select>
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item label="语速" prop="speed">
                <el-input-number v-model="form.speed" :min="0.5" :max="2" :step="0.1" class="w-full" />
              </el-form-item>
            </el-col>
            <el-col :xs="24" :md="8">
              <el-form-item label="语调" prop="pitch">
                <el-input-number v-model="form.pitch" :min="0.5" :max="2" :step="0.1" class="w-full" />
              </el-form-item>
            </el-col>
          </el-row>
        </el-form>
      </div>

      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="submitLoading" :disabled="uploadingAudio" @click="submitForm">创建并生成</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref, watch, watchEffect } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Upload, Delete, Refresh } from '@element-plus/icons-vue'
import { 
  createCustomVoice, 
  createTtsRecord, 
  deleteTtsRecord, 
  getTtsRecordPage,
  listCustomVoices,
  deleteCustomVoice 
} from '@/api/ai/tts'
import { commonGridOptions } from '@/common/table'
import { useWindowSize } from '@vueuse/core'

const loading = ref(false)
const submitLoading = ref(false)
const dialogVisible = ref(false)
const dialogTitle = ref('创建语音')
const total = ref(0)
const dataSource = ref<any[]>([])
const formRef = ref()
const selectedRows = ref<any[]>([]) // 多选行

const queryParams = reactive({
  page: 1,
  pageSize: 20,
  search: ''
})

const { height } = useWindowSize()
const gridOptions = ref<any>({
  ...commonGridOptions,
  columns: [
    { type: 'checkbox', width: 50 },
    { type: 'seq', title: '#', width: 58 },
    { title: '文案', field: 'text', minWidth: 220, slots: { default: 'textSlot' } },
    { title: '配置参数', field: 'configParams', minWidth: 260, slots: { default: 'configSlot' } },
    { title: '试听', field: 'preview', width: 320, slots: { default: 'previewSlot' } },
    { title: '时长(秒)', field: 'duration', width: 96 },
    { title: '状态', field: 'status', width: 88, slots: { default: 'statusSlot' } },
    { title: '创建时间', field: 'createTime', width: 170 },
    { title: '操作', fixed: 'right', width: 90, slots: { default: 'operationSlot' } }
  ]
})

watchEffect(() => {
  gridOptions.value.maxHeight = height.value - 255
})

const form = reactive({
  id: '',
  text: '',
  voice: 'Cherry',
  model: 'qwen3-tts-flash',
  format: 'mp3',
  instructions: '',
  sample_rate: 24000,
  speed: 1,
  pitch: 1
})

const selectedInstructionTemplate = ref('')
const customVoiceInfo = ref<any>(null)
const uploadingAudio = ref(false)
const voiceSource = ref<'existing' | 'upload'>('existing') // 音色来源：existing=选择已有，upload=上传新音频
const customVoiceName = ref('') // 用户输入的音色名称
const customVoiceList = ref<any[]>([]) // 已创建的音色列表
const loadingVoices = ref(false) // 加载音色列表中

// 格式化音色显示名称
const formatVoiceName = (item: any) => {
  // 如果有 preferred_name 就用它
  if (item.preferred_name) {
    return item.preferred_name
  }
  // 否则从 voice ID 中提取后缀作为标识
  const voice = item.voice || ''
  const lastPart = voice.split('-').slice(-2).join('-') // 提取最后两段
  return lastPart || voice
}

const instructionTemplates = [
  {
    label: '标准播音风格：字正腔圆，吐字清晰',
    value: '标准播音风格：吐字清晰精准，字正腔圆，语速中等，语调稳健。'
  },
  {
    label: '广告配音：活力感染力强',
    value: '广告配音风格：音调偏高，语速中等偏快，充满活力和感染力，强调卖点。'
  },
  {
    label: '温柔治愈：语速偏慢，温暖亲切',
    value: '温柔治愈风格：语速偏慢，音调柔和甜美，语气温暖关怀，像贴心朋友。'
  },
  {
    label: '新闻播报：冷静客观',
    value: '新闻播报风格：语速中等偏快，吐字清晰，语调平稳，客观冷静。'
  },
  {
    label: '纪录片解说：沉稳厚重',
    value: '纪录片解说：语速中等，音色浑厚，语调沉稳，叙事感强。'
  },
  {
    label: '有声书朗读：情感细腻',
    value: '有声书朗读：语速中等偏慢，情感细腻，停顿自然，带叙事节奏。'
  },
  {
    label: '游戏角色：性格鲜明',
    value: '游戏角色配音：语调起伏明显，情绪鲜明，节奏感强，角色感突出。'
  },
  {
    label: '情绪递进：由平静到激动',
    value: '情绪递进效果：从平静叙述逐渐增强情绪，音量上扬，语速略快。'
  },
  {
    label: '低沉磁性：稳重有力',
    value: '低沉磁性：音调偏低，语速中等，音色有磁性，沉稳有力。'
  },
  {
    label: '清脆甜美：轻快俏皮',
    value: '清脆甜美：音调偏高，语速偏快，语气轻快俏皮，活泼明亮。'
  },
  {
    label: '理性教学：清晰有条理',
    value: '理性教学风格：语速中等，吐字清楚，逻辑感强，节奏有条理。'
  },
  {
    label: '高能发布：节奏紧凑',
    value: '高能发布：语速偏快，语调上扬，节奏紧凑，情绪饱满。'
  },
  {
    label: '舒缓冥想：平稳放松',
    value: '舒缓冥想：语速慢，音调平稳，语气柔和放松，适合引导与放松。'
  }
]

const isInstructModel = computed(() => form.model === 'qwen3-tts-instruct-flash')
const isVoiceCloneModel =computed(() => form.model === 'qwen3-tts-vc-2026-01-22')

watch(
  () => form.model,
  (model) => {
    if (model !== 'qwen3-tts-instruct-flash') {
      form.instructions = ''
      selectedInstructionTemplate.value = ''
    }
    if (model !== 'qwen3-tts-vc-2026-01-22') {
      customVoiceInfo.value = null
      voiceSource.value = 'existing'
      // 切换到其他模型时，恢复默认音色
      if (!form.voice || form.voice.startsWith('qwen-tts-vc-')) {
        form.voice = 'Cherry'
      }
    } else {
      // 切换到声音复刻模型时，清空音色选择
      form.voice = ''
      customVoiceInfo.value = null
      // 加载音色列表
      if (dialogVisible.value) {
        loadCustomVoices()
      }
    }
  }
)

// 监听音色来源变化，清空相关状态
watch(
  () => voiceSource.value,
  () => {
    form.voice = ''
    customVoiceInfo.value = null
    customVoiceName.value = ''
  }
)

const rules = {
  text: [{ required: true, message: '请输入文案', trigger: 'blur' }],
  voice: [{ required: true, message: '请选择音色', trigger: 'change' }],
  model: [{ required: true, message: '请选择模型', trigger: 'change' }]
}

const resetForm = () => {
  form.id = ''
  form.text = ''
  form.voice = 'Cherry'
  form.model = 'qwen3-tts-flash'
  form.format = 'mp3'
  form.instructions = ''
  selectedInstructionTemplate.value = ''
  customVoiceInfo.value = null
  customVoiceName.value = ''
  voiceSource.value = 'existing'
  form.sample_rate = 24000
  form.speed = 1
  form.pitch = 1
}

// 加载自定义音色列表
const loadCustomVoices = async () => {
  if (loadingVoices.value) return
  
  loadingVoices.value = true
  try {
    const res = await listCustomVoices({ pageIndex: 0, pageSize: 100 })
    const payload = res?.data ?? res
    customVoiceList.value = payload?.voices || []
    if (customVoiceList.value.length > 0) {
      console.log('成功加载音色列表，共', customVoiceList.value.length, '个音色')
    }
  } catch (error: any) {
    console.error('loadCustomVoices error:', error)
    ElMessage.error(error?.message || '加载音色列表失败')
  } finally {
    loadingVoices.value = false
  }
}

// 选择音色
const handleVoiceSelect = (voice: string) => {
  const selectedVoice = customVoiceList.value.find(v => v.voice === voice)
  if (selectedVoice) {
    customVoiceInfo.value = {
      voice: selectedVoice.voice,
      preferredName: formatVoiceName(selectedVoice),
      targetModel: selectedVoice.target_model
    }
  }
}

// 删除自定义音色
const handleDeleteVoice = async (voice: string) => {
  try {
    await ElMessageBox.confirm('确认删除该音色吗？删除后将无法恢复。', '删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
    
    await deleteCustomVoice(voice)
    ElMessage.success('音色删除成功')
    
    // 如果删除的是当前选中的音色，清空选择
    if (form.voice === voice) {
      form.voice = ''
      customVoiceInfo.value = null
    }
    
    // 刷新列表
    await loadCustomVoices()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '删除音色失败')
    }
  }
}

const handleAudioChange = async (file: any) => {
  if (!file || !file.raw) return

  const audioFile = file.raw
  const maxSize = 10 * 1024 * 1024 // 10MB
  if (audioFile.size > maxSize) {
    ElMessage.error('音频文件不能超过10MB')
    return
  }

  uploadingAudio.value = true
  try {
    // 读取文件并转base64
    const reader = new FileReader()
    reader.onload = async (e) => {
      const base64 = e.target?.result as string
      const base64Data = base64.split(',')[1]

      // 确定音色名称：优先使用用户输入，否则使用文件名生成
      let preferredName = ''
      if (customVoiceName.value.trim()) {
        // 使用用户输入的名称，清理非法字符
        preferredName = customVoiceName.value.trim()
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .replace(/^[0-9_-]+/, '')
          .substring(0, 32)
      }
      
      // 如果用户未输入或清理后为空，使用文件名生成
      if (!preferredName) {
        const rawName = audioFile.name.replace(/\.[^/.]+$/, '')
        preferredName = rawName
          .replace(/[^a-zA-Z0-9_-]/g, '_')
          .replace(/^[0-9_-]+/, '')
          .substring(0, 32)
          || 'custom_voice_' + Date.now()
      }

      try {
        const res = await createCustomVoice({
          audioBase64: base64Data,
          targetModel: 'qwen3-tts-vc-2026-01-22',
          preferredName: preferredName,
          audioMimeType: audioFile.type || 'audio/mpeg'
        })

        const payload = res?.data ?? res
        if (payload?.success && payload?.voice) {
          customVoiceInfo.value = {
            voice: payload.voice,
            preferredName: payload.preferredName,
            targetModel: payload.targetModel
          }
          form.voice = payload.voice
          ElMessage.success(`自定义音色"${payload.preferredName}"创建成功`)
          // 清空输入的音色名称
          customVoiceName.value = ''
          // 刷新音色列表
          await loadCustomVoices()
        } else {
          throw new Error('创建音色失败')
        }
      } catch (error: any) {
        ElMessage.error(error?.message || '创建自定义音色失败')
        customVoiceInfo.value = null
      } finally {
        uploadingAudio.value = false
      }
    }
    reader.onerror = () => {
      ElMessage.error('读取音频文件失败')
      uploadingAudio.value = false
    }
    reader.readAsDataURL(audioFile)
  } catch (error) {
    ElMessage.error('处理音频文件失败')
    uploadingAudio.value = false
  }
}

const applyInstructionTemplate = (value: string) => {
  if (!value) return
  form.instructions = value
}

const formatConfig = (configParams: any) => {
  if (!configParams) return '-'
  const instructions = configParams.instructions
    ? truncateText(String(configParams.instructions), 60)
    : ''
  const parts = [
    `voice:${configParams.voice || '-'}`,
    `model:${configParams.model || '-'}`,
    `format:${configParams.format || '-'}`,
    `speed:${configParams.speed ?? '-'}`,
    `pitch:${configParams.pitch ?? '-'}`
  ]
  if (instructions) {
    parts.push(`instructions:${instructions}`)
  }
  return parts.join(' | ')
}

const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) return text
  return `${text.slice(0, maxLength)}...`
}

const getList = async () => {
  loading.value = true
  try {
    const res = await getTtsRecordPage({
      page: queryParams.page,
      pageSize: queryParams.pageSize,
      search: queryParams.search
    })
    const payload = res?.data ?? res
    dataSource.value = payload?.list || []
    total.value = payload?.total || 0
  } finally {
    loading.value = false
  }
}

const handleAdd = () => {
  dialogTitle.value = '创建语音'
  resetForm()
  dialogVisible.value = true
  // 默认加载音色列表（声音复刻模型可能用到）
  loadCustomVoices()
}

const submitForm = async () => {
  await formRef.value?.validate()

  // 如果是声音复刻模型，检查音色
  if (form.model === 'qwen3-tts-vc-2026-01-22') {
    if (voiceSource.value === 'existing' && !form.voice) {
      ElMessage.warning('请选择已有音色')
      return
    }
    if (voiceSource.value === 'upload' && !customVoiceInfo.value) {
      ElMessage.warning('请先上传音频文件创建自定义音色')
      return
    }
  }

  submitLoading.value = true
  try {
    const res = await createTtsRecord({
      text: form.text,
      voice: form.voice,
      model: form.model,
      format: form.format,
      instructions: form.instructions,
      sample_rate: form.sample_rate,
      speed: form.speed,
      pitch: form.pitch
    })
    const payload = res?.data ?? res

    if (payload?.status === 'failed') {
      ElMessage.warning(`创建成功，但生成失败：${payload?.errorMessage || '未知错误'}`)
    } else {
      ElMessage.success('创建并生成成功')
    }

    dialogVisible.value = false
    await getList()
  } finally {
    submitLoading.value = false
  }
}

const handleDelete = async (row: any) => {
  await ElMessageBox.confirm('确认删除该记录吗？', '提示', { type: 'warning' })
  await deleteTtsRecord(row.id)
  ElMessage.success('删除成功')
  await getList()
}

// 多选change事件
const handleCheckboxChange = ({ records }: any) => {
  selectedRows.value = records
}

// 全选change事件
const handleCheckboxAll = ({ records }: any) => {
  selectedRows.value = records
}

// 批量删除
const handleBatchDelete = async () => {
  if (selectedRows.value.length === 0) {
    ElMessage.warning('请选择要删除的记录')
    return
  }

  try {
    await ElMessageBox.confirm(`确认删除选中的 ${selectedRows.value.length} 条记录吗？`, '批量删除确认', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })

    loading.value = true
    const deletePromises = selectedRows.value.map(row => deleteTtsRecord(row.id))
    await Promise.all(deletePromises)
    
    ElMessage.success(`成功删除 ${selectedRows.value.length} 条记录`)
    selectedRows.value = []
    await getList()
  } catch (error: any) {
    if (error !== 'cancel') {
      ElMessage.error(error?.message || '批量删除失败')
    }
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  getList()
})
</script>

<style scoped>
.tts-page {
  height: 100%;
  padding: 10px;
  background-color: var(--el-bg-color);
}

.list-page-layout {
  display: flex;
  flex-direction: column;
  height: 100%;
  padding: 0;
}

.filter-section {
  margin: 0;
  margin-bottom: 12px;
  flex-shrink: 0;
}

.table-section {
  flex: 1;
  min-height: 0;
}

.pagination-section {
  display: flex;
  justify-content: flex-end;
  flex-shrink: 0;
  margin-top: 16px;
  margin-bottom: 24px;
}

.content-container {
  padding: 0;
}

.common-table {
  overflow-x: auto;
}

.search-bar {
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
}

.search-form-container {
  display: flex;
  flex-wrap: nowrap;
  align-items: center;
  justify-content: flex-start;
  gap: 10px 12px;
  margin-bottom: 12px;
}

.search-field {
  display: flex;
  align-items: center;
  gap: 6px;
  min-height: 32px;
  width: 240px;
  flex-shrink: 0;
}

.search-field-wide {
  width: 320px;
}

.search-field-actions {
  width: auto;
  flex: 1;
}

.search-field-actions .search-label {
  display: none;
}

.search-label {
  width: 48px;
  min-width: 48px;
  text-align: right;
  padding-right: 4px;
  line-height: 32px;
  flex-shrink: 0;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.search-field > :not(.search-label) {
  flex: 1;
  min-width: 0;
  max-width: 100%;
}

.search-field .el-input,
.search-field .el-select {
  width: 100%;
}

.search-field .el-button {
  white-space: nowrap;
}

.search-actions {
  display: flex;
  flex-wrap: nowrap;
  justify-content: flex-start;
  column-gap: 6px;
  row-gap: 6px;
  align-items: center;
}

@media (max-width: 1200px) {
  .search-form-container {
    flex-wrap: wrap;
  }

  .search-field-actions {
    flex: none;
    width: 100%;
  }

  .search-actions {
    flex-wrap: wrap;
  }
}


.audio-preview {
  width: 300px;
  height: 28px;
}

.clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  line-clamp: 3;
  overflow: hidden;
  word-break: break-all;
}

.config-cell {
  white-space: normal;
  line-height: 1.4;
  word-break: break-all;
}

.instruction-tip {
  margin-top: 6px;
  color: var(--el-text-color-regular);
  font-size: 12px;
  line-height: 1.5;
}

.voice-name-tip {
  margin-top: 6px;
  color: var(--el-text-color-secondary);
  font-size: 12px;
  line-height: 1.4;
}

.tts-create-dialog :deep(.el-dialog__body) {
  padding: 0;
}

.tts-create-body {
  height: calc(100vh - 124px);
  overflow-y: auto;
  padding: 24px;
}

@media (max-width: 768px) {
  .tts-create-body {
    padding: 16px;
    height: calc(100vh - 116px);
  }
}

.voice-list-container {
  width: 100%;
}

.voice-list-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  color: var(--el-text-color-regular);
  font-size: 13px;
}

.voice-option {
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
}

.voice-empty {
  padding: 12px;
  text-align: center;
  color: var(--el-text-color-secondary);
  font-size: 13px;
  background-color: var(--el-fill-color-light);
  border-radius: 4px;
  margin-top: 8px;
}
</style>
