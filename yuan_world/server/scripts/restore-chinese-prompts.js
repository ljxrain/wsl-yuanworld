const { Template } = require('../models');
const { connectDatabase } = require('../config/database');

const chinesePrompts = new Map([
  [3, `参考照片1与参考照片2中的人物作为情侣，生成两人在公园小道散步的场景。
正面半身像，脸部完全保持参考照片一致。
周围有绿树和花朵，阳光自然，氛围浪漫。`],
  [4, `参考照片1与参考照片2中的人物作为情侣，生成两人在超市购物的场景。
正面半身像，脸部完全保持参考照片一致。
背景为货架与商品，可见购物车或购物篮，氛围自然真实。`],
  [5, `参考照片1与参考照片2中的人物作为情侣，生成两人在厨房餐桌一起吃早餐的场景。
正面半身像，脸部完全保持参考照片一致。
桌上有牛奶、吐司、鸡蛋，光线柔和，氛围温馨。`],
  [6, `参考照片1与参考照片2中的人物作为情侣，正面对镜头的半身像。
两人站在商业街上，背景是橱窗和霓虹灯，氛围轻松愉快。
保持两人脸部五官与参考照片完全一致。`],
  [7, `参考照片1与参考照片2中的人物作为情侣，正面对镜头的半身像。
两人并肩坐在咖啡馆的桌前，桌上有咖啡和甜点。
脸部完全保持参考照片一致，氛围温馨浪漫。`],
]);

(async () => {
  try {
    await connectDatabase();
    let ok = 0, fail = 0;
    for (const [id, prompt] of chinesePrompts.entries()) {
      const t = await Template.findByPk(id);
      if (!t) {
        console.log(`⚠️ 模板 ${id} 不存在`);
        fail++;
        continue;
      }
      t.prompt = prompt;
      await t.save();
      console.log(`✅ 模板 ${id}（${t.name}）已恢复为中文prompt`);
      ok++;
    }
    console.log(`\n完成：成功 ${ok}，失败 ${fail}`);
    process.exit(0);
  } catch (e) {
    console.error('❌ 回滚失败：', e);
    process.exit(1);
  }
})();
