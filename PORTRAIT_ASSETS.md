# 小小侠客立绘资产清单

> 风格基准：粗粝、风尘、江湖感，半身武侠像素立绘，软羊皮纸背景。  
> 实际接入目录：`assets/portraits_pixel/`  
> 原始高精立绘目录：`assets/portraits/`，保留作母版，不直接用于 UI 加载。  
> 当前代码默认使用 `*_pixel_320.webp`；`*_pixel_240.webp` 作为小卡片/缩略图备用。

---

## 1. UI 使用规范

| 场景 | 建议资源 | 建议显示尺寸 | CSS 建议 |
|---|---|---:|---|
| 角色选择卡片 | `*_pixel_240.webp` 或 `*_pixel_320.webp` | 120x160 到 160x210 | `aspect-ratio: 3 / 4; object-fit: cover;` |
| 角色详情大图 | `*_pixel_320.webp` | 220x300 到 280x380 | `aspect-ratio: 3 / 4; object-fit: cover;` |
| Boss 剧情弹窗 | `*_pixel_320.webp` | 240x320 到 320x427 | `aspect-ratio: 3 / 4; object-fit: cover;` |
| 战斗立绘 | `*_pixel_320.webp` | 依战斗布局缩放 | `object-fit: cover; object-position: center top;` |

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

## 2. 接入约定

- `*_pixel_320.webp`：默认接入版本，清晰度和体积平衡。
- `*_pixel_240.webp`：卡片小图备用版本，体积更小。
- 生成过程中的 PNG 源图和预览图已清理，避免项目目录被未引用素材拖大。

---

## 3. 主角立绘

| 角色 ID | 角色名 | 320 WebP | 大小 | 240 WebP | 大小 |
|---|---|---|---:|---|---:|
| `wanderer` | 沈孤云 | `assets/portraits_pixel/shen_guyun_pixel_320.webp` | 22.0 KB | `assets/portraits_pixel/shen_guyun_pixel_240.webp` | 11.7 KB |
| `constable` | 陆惊尘 | `assets/portraits_pixel/lu_jingchen_pixel_320.webp` | 13.7 KB | `assets/portraits_pixel/lu_jingchen_pixel_240.webp` | 7.5 KB |
| `orthodox` | 顾明昭 | `assets/portraits_pixel/gu_mingzhao_pixel_320.webp` | 16.7 KB | `assets/portraits_pixel/gu_mingzhao_pixel_240.webp` | 8.9 KB |

代码接入：

```js
portraitImage: "assets/portraits_pixel/shen_guyun_pixel_320.webp"
portraitImage: "assets/portraits_pixel/lu_jingchen_pixel_320.webp"
portraitImage: "assets/portraits_pixel/gu_mingzhao_pixel_320.webp"
```

---

## 4. 江湖浪客线 Boss

主线：`孤云逐浪`  
敌对势力：正派武盟  
> ⚠️ v5.4 重构：Boss已从 陆闻川/孟天衡/岳宗玄 更新为 赵崇岳/沈千山/楚宗玄，立绘待重新生成。孟天衡转为盟友角色，其旧立绘 `meng_tianheng_pixel` 可用于NPC对话。

| Boss ID | 名称 | 年份 | 320 WebP | 大小 | 240 WebP | 大小 |
|---|---|---:|---|---:|---|---:|
| `wanderer_boss_y1` | 杭州堂主·赵崇岳 | 1 | `assets/portraits_pixel/zhao_chongyue_pixel_320.webp` | 待生成 | `assets/portraits_pixel/zhao_chongyue_pixel_240.webp` | 待生成 |
| `wanderer_boss_y2` | 左护法·沈千山 | 2 | `assets/portraits_pixel/shen_qianshan_pixel_320.webp` | 待生成 | `assets/portraits_pixel/shen_qianshan_pixel_240.webp` | 待生成 |
| `wanderer_final` | 武盟统领·楚宗玄 | 3 | `assets/portraits_pixel/chu_zongxuan_pixel_320.webp` | 待生成 | `assets/portraits_pixel/chu_zongxuan_pixel_240.webp` | 待生成 |

---

## 5. 朝廷鹰犬线 Boss

主线：`铁鹰入局`  
敌对势力：内廷权宦

| Boss ID | 名称 | 年份 | 320 WebP | 大小 | 240 WebP | 大小 |
|---|---|---:|---|---:|---|---:|
| `constable_boss_y1` | 东厂档头·韩玉阙 | 1 | `assets/portraits_pixel/han_yuque_pixel_320.webp` | 12.7 KB | `assets/portraits_pixel/han_yuque_pixel_240.webp` | 7.3 KB |
| `constable_boss_y2` | 锦衣指挥使·沈镇岳 | 2 | `assets/portraits_pixel/shen_zhenyue_pixel_320.webp` | 15.6 KB | `assets/portraits_pixel/shen_zhenyue_pixel_240.webp` | 8.1 KB |
| `constable_final` | 司礼监掌印·魏承恩 | 3 | `assets/portraits_pixel/wei_chengen_pixel_320.webp` | 13.5 KB | `assets/portraits_pixel/wei_chengen_pixel_240.webp` | 7.3 KB |

---

## 6. 名门正派线 Boss

主线：`天衡照邪`  
敌对势力：鬼教

| Boss ID | 名称 | 年份 | 320 WebP | 大小 | 240 WebP | 大小 |
|---|---|---:|---|---:|---|---:|
| `orthodox_boss_y1` | 鬼教香主·白无咎 | 1 | `assets/portraits_pixel/bai_wujiu_pixel_320.webp` | 15.6 KB | `assets/portraits_pixel/bai_wujiu_pixel_240.webp` | 8.5 KB |
| `orthodox_boss_y2` | 黑莲护法·桑暮雨 | 2 | `assets/portraits_pixel/sang_muyu_pixel_320.webp` | 16.3 KB | `assets/portraits_pixel/sang_muyu_pixel_240.webp` | 9.0 KB |
| `orthodox_final` | 鬼教掌门·夜摩罗 | 3 | `assets/portraits_pixel/ye_moluo_pixel_320.webp` | 15.8 KB | `assets/portraits_pixel/ye_moluo_pixel_240.webp` | 8.5 KB |

---

## 7. 普通奇遇敌人

这些敌人由切磋、伏击、擂台、拦路、悬赏等奇遇战斗随机抽取。

| 敌人 ID | 名称 | 320 WebP | 大小 | 240 WebP | 大小 |
|---|---|---|---:|---|---:|
| `rogue` | 二流高手 | `assets/portraits_pixel/rogue_pixel_320.webp` | 29.2 KB | `assets/portraits_pixel/rogue_pixel_240.webp` | 18.1 KB |
| `blade` | 快刀手 | `assets/portraits_pixel/blade_pixel_320.webp` | 26.5 KB | `assets/portraits_pixel/blade_pixel_240.webp` | 16.6 KB |
| `highDodgeAssassin` | 踏影刺客 | `assets/portraits_pixel/highDodgeAssassin_pixel_320.webp` | 26.7 KB | `assets/portraits_pixel/highDodgeAssassin_pixel_240.webp` | 17.0 KB |
| `armorBreakBlade` | 裂甲刀客 | `assets/portraits_pixel/armorBreakBlade_pixel_320.webp` | 35.6 KB | `assets/portraits_pixel/armorBreakBlade_pixel_240.webp` | 21.6 KB |
| `qiSuppressFist` | 断脉拳师 | `assets/portraits_pixel/qiSuppressFist_pixel_320.webp` | 26.1 KB | `assets/portraits_pixel/qiSuppressFist_pixel_240.webp` | 16.5 KB |
| `witch` | 毒娘子 | `assets/portraits_pixel/witch_pixel_320.webp` | 26.8 KB | `assets/portraits_pixel/witch_pixel_240.webp` | 17.6 KB |
| `demon` | 心魔 | `assets/portraits_pixel/demon_pixel_320.webp` | 32.3 KB | `assets/portraits_pixel/demon_pixel_240.webp` | 20.0 KB |

---

## 8. 小 Boss

这些敌人由小 Boss 奇遇和部分主线抗争战斗触发。

| 小 Boss ID | 名称 | 320 WebP | 大小 | 240 WebP | 大小 |
|---|---|---|---:|---|---:|
| `mini_bleed_blade` | 血刀客 | `assets/portraits_pixel/mini_bleed_blade_pixel_320.webp` | 32.1 KB | `assets/portraits_pixel/mini_bleed_blade_pixel_240.webp` | 20.3 KB |
| `mini_frost_assassin` | 寒衣刺客 | `assets/portraits_pixel/mini_frost_assassin_pixel_320.webp` | 32.7 KB | `assets/portraits_pixel/mini_frost_assassin_pixel_240.webp` | 20.4 KB |
| `mini_hamstring_blade` | 断筋刀师 | `assets/portraits_pixel/mini_hamstring_blade_pixel_320.webp` | 34.7 KB | `assets/portraits_pixel/mini_hamstring_blade_pixel_240.webp` | 21.3 KB |
| `mini_gu_priest` | 蛊道人 | `assets/portraits_pixel/mini_gu_priest_pixel_320.webp` | 37.7 KB | `assets/portraits_pixel/mini_gu_priest_pixel_240.webp` | 23.5 KB |
| `mini_coin_dart` | 金钱镖客 | `assets/portraits_pixel/mini_coin_dart_pixel_320.webp` | 35.1 KB | `assets/portraits_pixel/mini_coin_dart_pixel_240.webp` | 21.5 KB |
| `mini_armor_monk` | 玄甲武师 | `assets/portraits_pixel/mini_armor_monk_pixel_320.webp` | 29.0 KB | `assets/portraits_pixel/mini_armor_monk_pixel_240.webp` | 17.8 KB |

---

## 9. 体积对比

| 类型 | 旧资源大小 | 新默认资源大小 |
|---|---:|---:|
| 原始主角 / Boss PNG | 约 2.4 MB 到 3.0 MB / 张 | 不直接加载 |
| 320 WebP 像素版 | - | 约 12.7 KB 到 37.7 KB / 张 |
| 240 WebP 像素版 | - | 约 7.3 KB 到 23.5 KB / 张 |

以沈孤云为例：

| 文件 | 尺寸 | 大小 |
|---|---:|---:|
| `assets/portraits/shen_guyun.png` | 1086x1448 | 2.69 MB |
| `assets/portraits_pixel/shen_guyun_pixel_320.webp` | 320x427 | 22.0 KB |
| `assets/portraits_pixel/shen_guyun_pixel_240.webp` | 240x320 | 11.7 KB |

---

## 10. 接入状态

- `src/data/content.js` 的主角、三条主线年末 Boss、普通奇遇敌人、小 Boss 均已接入 `*_pixel_320.webp`。⚠️孤云逐浪线 Boss 立绘待重新生成（赵崇岳/沈千山/楚宗玄）。
- 原始 PNG 母版仍保留在 `assets/portraits/`。
- 若后续需要更极限的加载速度，可以在角色选择卡片中单独改用 `*_pixel_240.webp`。
