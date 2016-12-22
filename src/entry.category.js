//引入facet相关模块
require("./scripts/facet/normal");
//引入toolbar相关模块
require("./scripts/toolbar/normal");
require("./scripts/toolbar/pricerange");
//引入页面事件的模块-价格获取，懒加载图片
require("./scripts/about/lazyload");
//引入页面事件的模块-商品事件
require("./scripts/about/product");
if(isBwSec){
    require('./scripts/function/getShopGoods').getShopGoods();
}
setTimeout(function(){
    require('./scripts/function/getGoods').getGoods("三级列表页");
},0);

require("./scripts/bigdata/category/dsp.promotion");//右侧店铺精选和底部的推广商品
require("./scripts/bigdata/category/bigdata.weektop");//右侧一周销量排行广商品
require("./scripts/bigdata/category/bigdata.lookandbuy");//右侧浏览了还购买商品
require("./scripts/bigdata/category/bigdata.buyandbuy");//右侧购买了还购买商品
require("./scripts/bigdata/category/dsp.activity");//右侧底部推荐活动（图片）
require("./scripts/bigdata/category/dsp.activity.bottom");//页面底部推荐活动（图片）
require("./scripts/bigdata/category/bigdata.quessyoulike");//猜你喜欢