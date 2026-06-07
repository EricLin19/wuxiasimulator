# 小小侠客 BGM 音乐资产清单

> 最终版背景音乐，三条主线 + 主界面共 7 首 MP3。  
> 资产目录：`assets/audio/`

---

## 1. 音乐总览

| # | 文件名 | 用途 | 角色/故事线 |
|---|---|---|---|
| 1 | `主页面_纸灯回响.mp3` | 主菜单 / 选角 | 通用 |
| 2 | `沈孤云平_Lonely Dust Road.mp3` | 主线游历（平静） | 沈孤云·孤云逐浪 |
| 3 | `沈孤云战_Dustblade Wushan.mp3` | 战斗 | 沈孤云·孤云逐浪 |
| 4 | `铁鹰平__Chained Edict__.mp3` | 主线游历（平静） | 陆惊尘·铁鹰入局 |
| 5 | `铁鹰战_Iron Hawk Entry.mp3` | 战斗 | 陆惊尘·铁鹰入局 |
| 6 | `天衡照邪平_Black Lotus Rain.mp3` | 主线游历（平静） | 顾明昭·天衡照邪 |
| 7 | `天衡照邪战_Temple-Bell Duel.mp3` | 战斗 | 顾明昭·天衡照邪 |

---

## 2. 映射关系

| 人物 | 故事线 ID | 故事线名 | 游历 BGM | 战斗 BGM |
|---|---|---|---|---|
| 沈孤云 | `wanderer` | 孤云逐浪 | `沈孤云平_Lonely Dust Road.mp3` | `沈孤云战_Dustblade Wushan.mp3` |
| 陆惊尘 | `constable` | 铁鹰入局 | `铁鹰平__Chained Edict__.mp3` | `铁鹰战_Iron Hawk Entry.mp3` |
| 顾明昭 | `orthodox` | 天衡照邪 | `天衡照邪平_Black Lotus Rain.mp3` | `天衡照邪战_Temple-Bell Duel.mp3` |

---

## 3. 播放规则

- **主菜单 / 选角界面**：播放 `主页面_纸灯回响.mp3`
- **进入主线**：根据所选角色的故事线 ID 播放对应游历 BGM
- **进入战斗**：播放对应故事线的战斗 BGM，战斗结束后切回游历 BGM
- **切换音乐**：短淡入淡出（300ms out / 450ms in）
- **自动播放**：浏览器首次可能阻止；用户首次点击按钮后自动重试

---

## 4. 音量控制

- 默认音量 50%
- 主界面右上角 ⚙ 设置按钮 → 音乐音量滑动条
- 实时生效，影响所有音轨

---

## 5. 代码接入

- `src/systems/audioSystem.js` — 音轨定义、播放、切换、音量
- `src/main.js` — state.musicVolume / 渲染时调用 syncMusicForState
- `src/ui/render.js` — renderSettingsModal 设置弹窗
- `src/core/state.js` — musicVolume 状态

---

## 6. 技术规格

| 项目 | 规格 |
|---|---|
| 格式 | MP3 |
| 循环 | HTMLAudioElement `loop = true` |
| 预加载 | `preload = "auto"` |
| 淡入淡出 | requestAnimationFrame 线性插值 |

---

## 7. 替换指南

如果后续要替换音乐文件，保持文件名不变直接覆盖 `assets/audio/` 下对应的 MP3 即可，无需改代码。
