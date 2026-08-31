# 鱼丸网页角色资产

本目录中的 PNG 均由用户提供的五张透明角色参考图派生，不是重新设计的狗角色，也不包含整张合辑图或 CSS 精灵图。

- `core/idle|think|happy|point|rest.png`：来自参考图中的对应原始姿势，经忠实扁平清洗、独立裁切与统一画布处理。
- `states/search|run|spin|empty|favorite.png`：来自放大镜、奔跑、晕圈、趴等与抱心原始姿势。
- `states/ticket.png`：直接裁自第一张参考图第二行右侧的举票姿势。
- `states/map.png`：直接裁自第一张参考图第三行左侧的地图定位姿势。

所有文件均为 512×512 RGBA PNG，透明像素的 RGB 同步清零，以防浏览器缩放产生白边；低 alpha 阴影与相邻格碎片已清理。`scripts/process-yuwan-assets.ps1` 记录了裁切、透明清理和画布归一化步骤。
