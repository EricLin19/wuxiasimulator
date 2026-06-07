# 小小侠客立绘资产清单

> 风格基准：采用沈孤云三选一里的最左版方向，偏粗粝、风尘、江湖感。  
> 画面规格：简洁半身像，腰部以上，3/4 正面，软羊皮纸背景，适合小尺寸 UI 显示。  
> 资产目录：`assets/portraits/`

---

## 1. UI 使用规范

### 推荐显示尺寸

| 场景 | 建议尺寸 | CSS 建议 |
|---|---:|---|
| 角色选择卡片 | 120x160 到 160x210 | `aspect-ratio: 3 / 4; object-fit: cover;` |
| 角色详情大图 | 220x300 到 280x380 | `aspect-ratio: 3 / 4; object-fit: cover;` |
| Boss 剧情弹窗 | 240x320 到 320x430 | `aspect-ratio: 3 / 4; object-fit: cover;` |
| Boss 图鉴 / 预告 | 160x210 到 220x300 | `aspect-ratio: 3 / 4; object-fit: cover;` |

### 裁切建议

- 使用 `object-position: center top;`
- 头像顶部留 `6%-10%` 空白。
- 角色卡片中尽量显示到胸口或腰部，不要只裁脸。
- 所有卡片容器固定比例，避免不同原图尺寸导致 UI 跳动。

### 示例 CSS

```css
.portrait-art {
  width: 100%;
  aspect-ratio: 3 / 4;
  object-fit: cover;
  object-position: center top;
  border-radius: 8px;
  display: block;
}
```

---

## 2. 主角立绘

| 角色 ID | 角色名 | 路径 | 用途 |
|---|---|---|---|
| `wanderer` | 沈孤云 | `assets/portraits/shen_guyun.png` | 江湖浪客主角 |
| `constable` | 陆惊尘 | `assets/portraits/lu_jingchen.png` | 朝廷鹰犬主角 |
| `orthodox` | 顾明昭 | `assets/portraits/gu_mingzhao.png` | 名门正派主角 |

### 主角数据建议

```js
portraitImage: "assets/portraits/shen_guyun.png"
portraitImage: "assets/portraits/lu_jingchen.png"
portraitImage: "assets/portraits/gu_mingzhao.png"
```

---

## 3. 江湖浪客线 Boss

主线：`孤云逐浪`  
敌对势力：正派武盟

| Boss ID | 名称 | 年份 | 路径 | 定位 |
|---|---|---:|---|---|
| `wanderer_boss_y1` | 青旗堂主·陆闻川 | 1 | `assets/portraits/lu_wenchuan.png` | 流血刀 + 破防 |
| `wanderer_boss_y2` | 执法长老·孟天衡 | 2 | `assets/portraits/meng_tianheng.png` | 高防 + 断筋 |
| `wanderer_final` | 武盟帮主·岳宗玄 | 3 | `assets/portraits/yue_zongxuan.png` | 护体 + 净化 + 反击 |

---

## 4. 朝廷鹰犬线 Boss

主线：`铁鹰入局`  
敌对势力：内廷权宦

| Boss ID | 名称 | 年份 | 路径 | 定位 |
|---|---|---:|---|---|
| `constable_boss_y1` | 东厂档头·韩玉阙 | 1 | `assets/portraits/han_yuque.png` | 高命中 + 毒暗器 |
| `constable_boss_y2` | 锦衣指挥使·沈镇岳 | 2 | `assets/portraits/shen_zhenyue.png` | 破防 + 高暴击 |
| `constable_final` | 司礼监掌印·魏承恩 | 3 | `assets/portraits/wei_chengen.png` | 吸内 + 净化 + 高压制 |

---

## 5. 名门正派线 Boss

主线：`天衡照邪`  
敌对势力：鬼教

| Boss ID | 名称 | 年份 | 路径 | 定位 |
|---|---|---:|---|---|
| `orthodox_boss_y1` | 鬼教香主·白无咎 | 1 | `assets/portraits/bai_wujiu.png` | 毒 + 下蛊 |
| `orthodox_boss_y2` | 黑莲护法·桑暮雨 | 2 | `assets/portraits/sang_muyu.png` | 吸内 + 护体 |
| `orthodox_final` | 鬼教掌门·夜摩罗 | 3 | `assets/portraits/ye_moluo.png` | 毒蛊 + 复苏 + 持续压迫 |

---

## 6. 建议数据字段

角色数据可以增加：

```js
portraitImage: "assets/portraits/shen_guyun.png"
```

Boss 数据可以增加：

```js
portraitImage: "assets/portraits/yue_zongxuan.png"
storylineId: "wanderer"
year: 3
```

---

## 7. 文件清单

| 文件 | 尺寸 |
|---|---:|
| `assets/portraits/shen_guyun.png` | 1086x1448 |
| `assets/portraits/lu_jingchen.png` | 1023x1537 |
| `assets/portraits/gu_mingzhao.png` | 1086x1448 |
| `assets/portraits/lu_wenchuan.png` | 1024x1536 |
| `assets/portraits/meng_tianheng.png` | 1024x1536 |
| `assets/portraits/yue_zongxuan.png` | 1086x1448 |
| `assets/portraits/han_yuque.png` | 1024x1536 |
| `assets/portraits/shen_zhenyue.png` | 1024x1536 |
| `assets/portraits/wei_chengen.png` | 1086x1448 |
| `assets/portraits/bai_wujiu.png` | 1023x1537 |
| `assets/portraits/sang_muyu.png` | 1023x1537 |
| `assets/portraits/ye_moluo.png` | 1023x1537 |

---

## 8. 接入顺序建议

1. 先在角色选择页把三个主角立绘替换为 `portraitImage`。
2. 再在 Boss 剧情弹窗 / 年末挑战界面接入 Boss 立绘。
3. 统一卡片容器比例为 `3 / 4`。
4. 所有图片使用 `object-fit: cover` 和 `object-position: center top`。
5. 每次新增角色或 Boss，都继续沿用“粗粝半身武侠立绘 + 羊皮纸背景”的风格。

