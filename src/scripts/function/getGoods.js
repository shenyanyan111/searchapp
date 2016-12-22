/**
 * [description]
 * 根据排序pageData.sort，页码pageData.currentPage,异步获取商品,并重组数据（，）
 * 注：区域字段在请求的cookie里面.
 * 【一】pageData.bwsStaus==-1:初始请求，获取推荐的联营商品，
 * 【二】pageData.bwsStaus=='[pid,pid,pid.....pid]':综合排序【大于第一页】，获取以排除推荐联营商品的数据
 * 【三】pageData.bwsStaus==1：默认排序及分页请求，注：当综合排序第一页时需将 底部推荐联营商品 与 请求数据进行合并，
 *      合并规则：倒数查找自营商品 替换为 联营商品
 * 【四】综合第一页时将提前获取的底部推荐联营商品整合到主商品数据
 * 【五】如果请求有推广活动则再次重组主商品数据结构,根据主商品特性clothes，merchandise，isBigImg设置广告活动高度
 * 【function 1】综合排序第一页时，将推荐联营商品整合到异步主商品
 * 【function 2】异步请求如果有推广活动位，将活动数据整合到主商品
 * 【function 3】重新设置迷你分页器，底部分页器
 */
define(function(require,exports,module){
    /**
     * [description]
     * 商品模板+区域推广活动 art-template
     * {{noSkusStock}}： 无货标识，pagejs.ftl 根据区域设置
     * {{isActive}},是否广告位，
     */
    var tpl_item = '\
    {{each products}}\
    {{if $value.isActive}}\
    <li class="product-item product-ad" style="height:{{$value.height}}px">\
        <a class="item-link activeImg" data-code="{{modelid}}-{{pageBar.pageNumber}}_activities_{{$index+1}}" href="{{$value.url}}" title="{{$value.title}}" target="_blank">\
        <img src="//img.gomein.net.cn/images/grey.gif" gome-src="{{$value.img}}" alt="{{$value.pTxt}}">\
        </a>\
        <span class="product-ad-info">\
        <em class="product-ad-name">{{$value.title}}</em>\
        <em class="product-ad-title">{{$value.pTxt}}</em>\
        <a class="product-ad-btn" data-code="{{modelid}}-{{pageBar.pageNumber}}_activities_{{$index+1}}" href="{{$value.url}}" target="_blank">点击进入</a>\
        </span>\
    </li>\
    {{else}}\
    <li class="product-item">\
        <input class="productInfo" type="hidden" isMCard="{{$value.skus.gomeCardType}}" isHyg="{{$value.marketTag}}" isTaogou="false" pid="{{$value.pId}}" skuid="{{$value.skuId}}" prd-index="{{$index+1}}" saleCount="{{$value.salesVolume}}" evaluateCount="{{$value.evaluateCount}}" firstCat="{{$value.firstCat}}" secondCat="{{$value.secondCat}}" thirdCat="{{$value.defCatId}}" brandIds="" thirdProduct="{{$value.thirdProduct | formatBoolean}}" shopId="{{$value.shopId}}"  promoScore="{{$value.promoScore}}" score="{{$value.score}}" pStock="{{$value.skus.stock}}" pWeight="{{$value.skus.promoStock}}"/>\
        <ul class="arbitrage clearfix {{if $value.taoGou}}bor-bott{{/if}}">\
        {{if $value.taoGou}}\
            <li class="arbitrage-num arbitrage-cur" taogou="true" pId="{{$value.pId}}" sId="{{$value.skuId}}">单件</li>\
            {{each $value.taoGou}}\
            {{if $index < 3}}\
            <li class="arbitrage-num" taogou="false" pId="{{$value.pId}}" sId="{{$value.skuId}}">{{$value.num}}件套</li>\
            {{/if}}\
            {{/each}}\
        {{/if}}\
        </ul>\
        <div class="item-tab-warp asynPriceBox" id="gm-{{$value.pId}}-{{$value.skuId}}">\
        {{if $value.isBigImg}}\
        <p class="item-pic bigp"><a class="emcodeItem item-link" rel="nofollow" href="{{$value.skus.pUrl}}" target="_blank" data-code="{{modelid}}-{{pageBar.pageNumber}}_{{$index+1}}_1" title="{{$value.skus.alt}}"><img gome-src="{{$value.skus.sImg}}_220_275.jpg" alt="{{$value.skus.alt}}" src="//img.gomein.net.cn/images/grey.gif"></a></p>\
        {{else}}\
        <p class="item-pic"><a class="emcodeItem item-link" rel="nofollow" href="{{$value.skus.pUrl}}" target="_blank" data-code="{{modelid}}-{{pageBar.pageNumber}}_{{$index+1}}_1" title="{{$value.skus.alt}}"><img gome-src="{{$value.skus.sImg}}_210.jpg" src="//img.gomein.net.cn/images/grey.gif" alt="{{$value.skus.alt}}"></a>{{if $value.skus.energyTag == 1}}<span class="save-energy"></span>{{/if}}</p>\
        {{/if}}\
        {{if clothes || merchandise}}\
        <div class="item-pic-small-box" index="{{$value.images.length}}" curIndex="{{$value.images.length}}">\
            {{if $value.images.length> 5 }}\
            <a href="javascript:void(0);" class="icon-prev disable" onClick="javascript:smallImgSprev(this)"></a>\
            <a href="javascript:void(0);" class="icon-next" onClick="javascript:smallImgSnext(this)"></a>\
            {{/if}}\
            <div class="item-pic-small-wrap">\
                <ul class="imgList">\
                    {{each $value.images}}\
                    <li class="" sid="{{$value.skuId}}">\
                    <a href="javascript:void(0);" title="{{$value.color}}">\
                        <img onClick="javascript:smallImgOnClick(this)" gome-src="{{$value.sImg}}_30.jpg" sid="{{$value.skuId}}" d_src="{{$value.sImg}}" alt="{{$value.color}}" src="//img.gomein.net.cn/images/grey.gif" />\
                    </a>\
                    </li>\
                    {{/each}}\
                </ul>\
            </div>\
        </div>\
        {{/if}}\
        <div class="item-price-info">\
            <p class="item-price">\
                <span class="price asynPrice" pid="{{$value.pId}}" skuid="{{$value.skuId}}"></span>\
                {{if $value.skus.goodsType && $value.skus.goodsType == "ZC2M"}}\
                <span class="promotion-c2m"></span>\
                {{/if}}\
                {{if $value.marketTag && $value.marketTag == 1}}\
                <span class="promotion-hwg"></span>\
                {{/if}}\
                {{if $value.allPromos && $value.allPromos.length > 0}}\
                {{each $value.allPromos}}\
                <span class="promotion-normal">{{$value.name}}</span>\
                {{/each}}\
                {{/if}}\
            </p>\
        </div>\
        <p class="item-name"><a rel="nofollow" class="emcodeItem item-link" data-code="{{modelid}}-{{pageBar.pageNumber}}_{{$index+1}}_1" href="{{$value.skus.pUrl}}" target="_blank" title="{{$value.skus.alt}}">{{#$value.skus.name}}</a></p>\
        {{if $value.skus.promoDesc !=""}}\
        <p class="item-promotional-language">\
            <!--{{if $value.promoTags && $value.promoTags != null && $value.promoTags.promoType && $value.promoTags.promoType == 2}}\
                【{{$value.promoTags.promoPrice}}手机专享价】\
            {{/if}}-->\
            {{$value.skus.promoDesc}}\
        </p>\
        {{/if}}\
        <p class="item-comment-dispatching">\
        {{if $value.skus.stock==0 || noSkusStock}}\
            <span class="dispatching">{{$value.skus.cityName}}无货</span>\
        {{else if $value.skus.stock==1}}\
            <span class="dispatching">{{$value.skus.cityName}}有货</span>\
        {{else if $value.skus.stock==2}}\
            <span class="dispatching nOrange">{{$value.skus.cityName}}暂不支持配送</span>\
        {{else if $value.skus.stock==3}}\
            <span class="dispatching nOrange">正在预约中</span>\
        {{else if $value.skus.stock==4}}\
            <span class="dispatching nHeigh">正在抢购中</span>\
        {{else}}\
            <span class="dispatching">{{$value.skus.cityName}}无货</span>\
        {{/if}}\
            <a href="{{$value.skus.pUrl}}#j-comment-section" target="_blank" class="comment emcodeItem" data-code="{{modelid}}-{{pageBar.pageNumber}}_{{$index+1}}_2">{{$value.evaluateCount}}</a>\
        </p>\
        <p class="item-option clearfix">\
            <span class="add-contrast display-page-compare-checkbox emcodeProp17"></span>\
            <span class="add-collection">收藏</span>\
        {{if $value.skus.stock == 0 || noSkusStock}}\
            <span class="add-cart next-buy emcodeProp17">到货通知</span>\
        {{else if $value.skus.stock == 3 || $value.skus.stock == 4}}\
            <a href="{{productSite}}/{{$value.pId}}-{{$value.skus.skuId}}.html" target="_blank" class="add-cart prev-buy emcodeItem" data-code="{{modelid}}-{{pageBar.pageNumber}}_{{$index+1}}_3">预约购买</a>\
        {{else}}\
            <a class="add-cart addTo-cart emcodeProp17" href="javascript:void(0);" data-code="{{modelid}}-{{pageBar.pageNumber}}_{{$index+1}}_3">加入购物车</a>\
        {{/if}}\
        </p>\
        </div>\
        <p class="item-shop">\
        {{if $value.thirdProduct}}\
            <a class="nname" data-code="{{modelid}}-{{pageBar.pageNumber}}_{{$index+1}}_4" target="_blank" href="{{$value.mUrl}}">{{$value.sName}}</a>{{if $value.shopId =="80009736" || $value.shopId =="80010355" || $value.shopId =="80010423"}}<span class="hyg-shopType">国美自营</span>{{/if}}\
        {{else}}\
            <span class="nname">国美自营</span>\
        {{/if}}\
        </p>\
    </li>\
    {{/if}}\
    {{/each}}\
    ';
    /**
     * [description]
     * 重组主商品和推荐联营商品
     */
    function mixedShopData(mainArray,shopArray){
        if(shopArray.length == 0) return false;
        var _index = 0;
        for(var i = mainArray.length-1,j=shopArray.length;i>0&&j>0;i--){
            if(!mainArray[i].thirdProduct){
                j--;
                mainArray[i] = shopArray[_index++];
            }
        }
    }
    /**
     * [description]
     * 重组主商品和推广活动位，展示位置自定义
     */
    function mixActiveData(mainArray,activeArray,activeHeight){
        var posArr = [11,19,31];//广告位展示位置
        for(var i= 0;i<posArr.length;i++){
            var forIndex = posArr[i];
            if(activeArray[i] && mainArray[forIndex-1]){
                mainArray.splice(forIndex,0, $.extend({},activeArray[i],{isActive:true,height:activeHeight}));
            }
        }
    }
    function initPageNumber(){
        require("../plugin/pager");
        $("#j-page").ucPager({
            pageClass: "",
            currentPage: pageData.currentPage,
            totalPage: pageData.totalPage,
            pageSize: 48,
            clickCallback: function(curPage) {
                pageData.currentPage = curPage;
                getGoods();
            }
        });
        $("#min-pager-number").text(pageData.currentPage+'/'+pageData.totalPage);

        if(pageData.currentPage > 1 && pageData.currentPage < pageData.totalPage){
            $('#mp-prev').removeClass('mp-disable');
            $('#mp-next').removeClass('mp-disable');
        }else{
            if(pageData.currentPage === 1){
                $('#mp-prev').addClass('mp-disable');
            }else{
                $('#mp-next').addClass('mp-disable');
            }
        }
    }
    /**
     * [description]
     * 异步请求主数据方法，并且渲染页面，主要参数sort，currentPage
     */
    function getGoods(){
        if(pageData.sort === '00' && pageData.currentPage > 1){
            pageData.bwsStaus = '['+pageData.bwsString+']';
        }else{
            pageData.bwsStaus = '1';
        }
        $.ajax({
            type:'get',
            url:searchSite+'/cloud/asynSearch',
            data:{
                module: 'product',
                from: $('#pageType').text(),
                page: pageData.currentPage,
                sorts:pageData.sort,
                paramJson: $('#searchReq').text(),
                bws:pageData.bwsStaus
            },
            dataType:'jsonp',
            jsonpCallback:'callback_product',
            timeout:1000,
            beforeSend:function(){
                $('#product-waiting').show();
            },
            success:function(data){
                pageData.ajaxStatus = false;
                $('#product-waiting').hide();
                pageData.currentPage = data.pageBar.pageNumber;
                pageData.totalPage = data.pageBar.totalPage;
                if(pageData.sort === '00' && pageData.currentPage == 1 && pageData.bwsData.length>0){
                    //如果是综合第一页时，混合推荐联营商品
                    mixedShopData(data.products,pageData.bwsData);
                }
                if(data.activities && data.activities.length > 0){
                    var active_h = 427;
                    if(data.clothes || data.merchandise){active_h=+45};
                    if(data.products[0].isBigImg){active_h=+65};
                    mixActiveData(data.products,data.activities,active_h);
                }
                //活动推广位
                if(data.regionPromoInfo.promUrl){
                    $("#szSpread").remove();
                    $(".product-right-box").prepend("<a id='szSpread' data-code='9000000900-0' target='_blank' href='"+data.regionPromoInfo.promUrl+"'><img src='"+data.regionPromoInfo.imgUrl+"'></a>")
                }else{
                    $("#szSpread").remove();
                }
                //模板渲染
                template.helper("formatBoolean",function(data,format){
                    return String(data);
                });

                var itemHTML = templateSimple.compile(tpl_item)($.extend(data,{'noSkusStock':noSkusStock,'modelid':9000000700}));
                if($.trim(itemHTML) !=""){
                    $('#product-box').empty().html(itemHTML);
                    initPageNumber();
                }
            },
            error:function(req,error){
                pageData.ajaxStatus = false;
                $('#product-waiting').hide();
            }
        })
    }
    module.exports = {
        getGoods:getGoods
    }
});