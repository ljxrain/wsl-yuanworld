require('dotenv').config();
const { sequelize } = require('./server/config/database');
const Template = require('./server/models/Template');

const templates = [
    // 鐢熸椿鐓?(13寮?
    { name: '閮藉競澶滄櫙', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_18PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€備繚鎸佺幇浠ｉ兘甯傚鏅鏍?灞曠幇娲诲姏鍜屾椂灏氭劅銆?, sort_order: 1 },
    { name: '琛楀ご鏃跺皻', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_20PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傝澶存椂灏氶鏍?灞曠幇涓€ч瓍鍔涖€?, sort_order: 2 },
    { name: '椁愭鏃跺厜', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_21PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛俯棣ㄩ妗屽満鏅?灞曠幇鐢熸椿姘旀伅銆?, sort_order: 3 },
    { name: '搴熷鎺㈤櫓', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_26PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傚簾澧熸帰闄╅鏍?灞曠幇鍕囨暍鍐掗櫓绮剧銆?, sort_order: 4 },
    { name: '楂樺北涔嬫梾', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_28PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傞珮灞辫嚜鐒堕鍏?灞曠幇鎴峰娲诲姏銆?, sort_order: 5 },
    { name: '瀹跺涵鑱氶', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_29PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛俯棣ㄥ搴仛椁愬満鏅€?, sort_order: 6 },
    { name: '鍘ㄦ埧鏃ュ父', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_32PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛棩甯稿帹鎴跨敓娲诲満鏅€?, sort_order: 7 },
    { name: '鎽╁ぉ杞笅', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_35PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛懇澶╄疆涓嬬殑娴极鍦烘櫙銆?, sort_order: 8 },
    { name: '鏁欏爞鍓嶇害', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_39PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛暀鍫傚墠鐨勪紭闆呭満鏅€?, sort_order: 9 },
    { name: '鍩庡競澶滄父', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_41PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傚煄甯傚鏅氭极姝ュ満鏅€?, sort_order: 10 },
    { name: '婀栫晹闆櫙', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_43PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傚啲鏃ユ箹鐣旈洩鏅€?, sort_order: 11 },
    { name: '娴锋哗搴﹀亣', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_45PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傞槼鍏夋捣婊╁害鍋囬銆?, sort_order: 12 },
    { name: '灞呭娓╅Θ', category: 'life', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_49PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负涓昏,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛俯棣ㄥ眳瀹剁幆澧冦€?, sort_order: 13 },

    // 鎯呬荆鐓?(13寮?
    { name: '瀹跺眳鐢滆湝', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_50PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛俯棣ㄥ灞呮儏渚ｅ満鏅?灞曠幇鐢滆湝鐖辨剰銆?, sort_order: 14 },
    { name: '鐖卞績鏃╅', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_52PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛棭椁愭椂鍏夌殑鐢滆湝浜掑姩銆?, sort_order: 15 },
    { name: '鍘ㄦ埧鐖辨剰', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_56PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傚帹鎴夸腑鐨勬俯棣ㄤ簰鍔ㄣ€?, sort_order: 16 },
    { name: '鍏卞害鏃跺厜', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 10_59PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€備竴璧峰害杩囩編濂芥椂鍏夈€?, sort_order: 17 },
    { name: '鎽╁ぉ杞埍鎭?, category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_04PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛懇澶╄疆涓嬬殑娴极鐖辨亱銆?, sort_order: 18 },
    { name: '婀栧厜灞辫壊', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_07PM (1).png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛箹鍏夊北鑹蹭腑鐨勬氮婕€?, sort_order: 19 },
    { name: '澶滆壊婕', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_09PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傚鑹蹭腑鐨勬氮婕极姝ャ€?, sort_order: 20 },
    { name: '琛楀ご鎷ユ姳', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_10PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傝澶存繁鎯呮嫢鎶便€?, sort_order: 21 },
    { name: '閾佸涔嬫亱', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_12PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傞搧濉斾笅鐨勬氮婕埍鎭嬨€?, sort_order: 22 },
    { name: '鎴峰鍐欑湡', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_17PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛埛澶栬嚜鐒堕鍏夊啓鐪熴€?, sort_order: 23 },
    { name: '娴疯竟鐢滆湝', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_19PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛捣杈圭敎铚滄椂鍏夈€?, sort_order: 24 },
    { name: '鐧借。鎯呬荆', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_20PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傜櫧琛ｆ儏渚ｆ氮婕啓鐪熴€?, sort_order: 25 },
    { name: '闆北鎯呯紭', category: 'couple', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_21PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傞洩灞变箣宸呯殑娴极鎯呯紭銆?, sort_order: 26 },

    // 濠氱罕鐓?(13寮?
    { name: '鍙ゅ缓濠氱ぜ', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_23PM (2).png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?鍙ゅ吀寤虹瓚鑳屾櫙,搴勯噸鍏搁泤銆?, sort_order: 27 },
    { name: '鍙ゅ吀濠氱罕', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_27PM (1).png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?鍙ゅ吀濠氱罕椋庢牸,浼橀泤娴极銆?, sort_order: 28 },
    { name: '椁愭鍠滃', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 11_41PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?濠氬椁愭鍦烘櫙,鍠滃簡鐑椆銆?, sort_order: 29 },
    { name: '閾佸濠氱ぜ', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 8_40PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?閾佸鑳屾櫙,娴极鍞編銆?, sort_order: 30 },
    { name: '娴极榛勬槒', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 03, 2025 - 8_42PM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?榛勬槒鏃跺垎,娓╅Θ娴极銆?, sort_order: 31 },
    { name: '灞辨按濠氱罕', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_01AM (1).png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?灞辨按鑷劧鑳屾櫙銆?, sort_order: 32 },
    { name: '婀栧厜濠氱ぜ', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_01AM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?婀栧厜灞辫壊鑳屾櫙銆?, sort_order: 33 },
    { name: '澶滆壊濠氱罕', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_03AM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?澶滆壊娴极姘涘洿銆?, sort_order: 34 },
    { name: '閮藉競濠氱ぜ', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_05AM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?鐜颁唬閮藉競鑳屾櫙銆?, sort_order: 35 },
    { name: '鐧界罕浠欏', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_07AM (1).png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?浠欏鑸殑姊﹀够鍦烘櫙銆?, sort_order: 36 },
    { name: '搴勫洯濠氱ぜ', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_07AM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?搴勫洯鍩庡牎鑳屾櫙,鍗庝附鍏搁泤銆?, sort_order: 37 },
    { name: '闆北濠氱罕', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_08AM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?闆北缇庢櫙鑳屾櫙,绾噣鍞編銆?, sort_order: 38 },
    { name: '鐢滆湝濠氱収', category: 'wedding', image_path: '/images/鍋跺儚鍥剧墖/Generated Image October 04, 2025 - 9_11AM.png', prompt: '鍙傝€冨浘鐗?涓庡弬鑰冨浘鐗?涓殑浜虹墿浣滀负鏂伴儙鏂板,姝ｉ潰瀵归暅澶寸殑鍗婅韩鍍忋€傛柊濞樿韩绌跨櫧鑹插绾?鏂伴儙绌块粦鑹茶タ瑁?娓╅Θ鐢滆湝鐨勫绀煎満鏅€?, sort_order: 39 }
];

async function importTemplates() {
    try {
        console.log('馃攧 寮€濮嬫壒閲忓鍏?9涓ā鏉?..\n');

        await sequelize.authenticate();
        console.log('鉁?鏁版嵁搴撹繛鎺ユ垚鍔焅n');

        // 鍒犻櫎鐜版湁妯℃澘锛堝彲閫夛級
        const existingCount = await Template.count();
        console.log(`馃搳 褰撳墠妯℃澘鏁? ${existingCount}`);
        
        if (existingCount > 0) {
            console.log('馃棏锔? 鍒犻櫎鐜版湁妯℃澘...');
            await Template.destroy({ where: {} });
            console.log('鉁?宸叉竻绌虹幇鏈夋ā鏉縗n');
        }

        // 鎵归噺瀵煎叆
        console.log('馃摜 寮€濮嬪鍏ユ柊妯℃澘...');
        const result = await Template.bulkCreate(templates);
        
        console.log(`\n鉁?鎴愬姛瀵煎叆 ${result.length} 涓ā鏉匡紒\n`);
        console.log('馃搳 鍒嗙被缁熻:');
        console.log(`   - 鐢熸椿鐓? 13寮燻);
        console.log(`   - 鎯呬荆鐓? 13寮燻);
        console.log(`   - 濠氱罕鐓? 13寮燻);
        console.log(`   - 鎬昏: 39寮燶n`);
        
        console.log('馃帀 瀵煎叆瀹屾垚锛佺幇鍦ㄥ彲浠ュ湪妯℃澘绠＄悊椤甸潰鏌ョ湅鎵€鏈夋ā鏉夸簡銆?);
        process.exit(0);
    } catch (error) {
        console.error('鉂?瀵煎叆澶辫触:', error.message);
        console.error(error);
        process.exit(1);
    }
}

importTemplates();
