<template>
  <div style="height:100%;" class="app">
    <drawer>
      <view-box ref="viewBox" :body-padding-top="bodyTop" :body-padding-bottom="(showBar||showBtn)?'55px':'0'">
        <x-header v-if="!isWeixin&&showTitle" :left-options="{preventGoBack: true,backText:''}" :title="pageTitle" slot="header"  style="width:100%;position:absolute;left:0;top:0;z-index:100;" @on-click-back="back"></x-header>
        <router-view></router-view>
        <tabbar slot="bottom" v-if="showBar">
          <tabbar-item link="/" :selected="$route.path == '/'">
            <span slot="icon" class="icon icon-app"></span>
            <span slot="icon-active" class="icon icon-app_a"></span>
            <span slot="label">首页</span>
          </tabbar-item>
          <tabbar-item link="/invite" :selected="$route.path == '/invite'">
            <span slot="icon" class="icon icon-money"></span>
            <span slot="icon-active" class="icon icon-money_a"></span>
            <span slot="label">收益</span>
          </tabbar-item>
          <tabbar-item link="/me" :selected="$route.path == '/me'">
            <span slot="icon" class="icon icon-me"></span>
            <span slot="icon-active" class="icon icon-me_a"></span>
            <span slot="label">个人中心</span>
          </tabbar-item>
        </tabbar>
      </view-box>
    </drawer>
    <loading v-model="isLoading"></loading>
    <div v-html="fixScreenStyle"></div>
    <div v-html="style"></div>
  </div>
</template>
<script type="text/javascript" charset="utf-8" src="http://res.wx.qq.com/open/js/jweixin-1.1.0.js"></script>
<script>
import { Drawer, Loading, ViewBox, XHeader, Tabbar, TabbarItem } from 'vux'
import { mapGetters, mapActions } from 'vuex'
import wx from 'weixin-js-sdk'
export default {
	data() {
    	return {
      		site:{style:'#1AAD19'}//#3273dc
		}
	},
	components: {
	    Drawer, Loading,XHeader,ViewBox,Tabbar,TabbarItem
	},
	created(){
		this.getSite();
		if(this.$isNull(this.$db.get('bank_list'))){  //
			this.loadBankList();
		}
		var token = this.$db.get('token');
		if(this.isWeixin){
			var weixin_open_id = this.$db.get('weixin_open_id');
			if(!token || !weixin_open_id){
				let code = '';
				if(location.href.indexOf('code=')!=-1){
					code = location.href.match(/code=([^&]+)/)[1];
				}
				if(code){
					this.$axios.post('/api/weixin/info',{weixin_code:code}).then((res)=>{
						if(res.data.token){
							this.$store.commit('updateToken', res.data.token);
        					this.$db.set('token', res.data.token);
        					let the_user = res.data.data;
        					this.$store.commit('updateUser', the_user);
        					this.$db.set('weixin_open_id',the_user.weixin_open_id);
						}else{
							weixin_open_id = res.data.openid;
							this.$db.set('weixin_open_id',weixin_open_id);
							this.$db.set('weixin_user',res.data);
						}
					})
				}else{
					let _url = location.href;
					_url = encodeURI(_url);
					location.replace(`https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx93047f279e50497d&redirect_uri=${_url}&response_type=code&scope=snsapi_userinfo`);
					return;
				}
			}
			this.wxInit();
		}
	},
	mounted(){
        document.getElementById('loading').style.display = 'none';
        document.getElementsByClassName('app')[0].style.display = 'inline';
		document.body.addEventListener('touchmove', function (e) {
            if(navigator.userAgent.indexOf('iPhone')!=-1){
                let touchType = document.querySelector('#vux_view_box_body').style.webkitOverflowScrolling;
                if(touchType=='touch'){
                  document.querySelector('#vux_view_box_body').style.webkitOverflowScrolling=null;  
                }
            }
            if(e.target.tagName=='INPUT'){return;}
			var scroll_obj = document.querySelector('#vux_view_box_body div').getBoundingClientRect();
			var tabbar_obj = document.querySelector('.weui-tabbar');
			var tabbar_height = 0;
			if(tabbar_obj){
				tabbar_height = tabbar_obj.getBoundingClientRect().height;
			}
			if(tabbar_height + scroll_obj.height <= document.getElementById('vux_view_box_body').offsetHeight){
                // this.$store.commit("updatePageTitle", tabbar_height +"|"+ scroll_obj.height+document.getElementById('vux_view_box_body').offsetHeight);
				e.preventDefault();
			}
		}, {passive: false});
        
		var lastScrollTop = 0;
		document.addEventListener('focusin', function () {
		　　//软键盘弹出的事件处理
			var body = document.querySelector('body');
			lastScrollTop = body.scrollTop
		});
		  
		document.addEventListener('focusout', function () {
		　var body = document.querySelector('body');
			body.scrollTop = lastScrollTop;
		});
        
        var script_url = document.querySelector('script').src;
        var now = new Date().getTime();
        this.$axios.get(script_url + '?v=' + now).catch(() => {
          this.$vux.confirm.show({
              title: '检测到新版本,确定刷新缓存吗？',
              onConfirm() {
                locatino.href += '?v=' + now;
              }
            }) 
        });
	},
	computed:{
		...mapGetters(['page_title','is_loading','user']),
		pageTitle(){
			return this.page_title;
		},
		isWeixin(){
			return window.navigator.userAgent.indexOf('MicroMessenger')!=-1;
		},
		isLoading(){
		 	return this.is_loading;
		},
		showTitle(){
			return !this.$route.meta.hideTitle;
		},
		showBar(){
			return this.$route.meta.showBar;
		},
		showBtn(){
			return this.$route.meta.showBtn;
		},
		backUrl(){
			return this.$route.meta.backUrl;
		},
		bodyTop(){
			return !this.isWeixin&&this.showTitle?'46px':'0';
			/*
			if(window.innerWidth/window.innerHeight>=0.5){
				return !this.isWeixin&&this.showTitle?'46px':'0';
			}else{
				return !this.isWeixin&&this.showTitle?'76px':'30px';
			}*/
		},
		fixScreenStyle(){
			let fixStyle = '<style type="text/css">';
			if(navigator.userAgent.indexOf('iPhone')!=-1){
				if(!this.showTitle){
					fixStyle += 'body{background-color:#fff !important;}'
				}
				fixStyle += `div.weui-tab__panel{-webkit-overflow-scrolling:inherit}`;
			}
			fixStyle += '</style>'
			if(window.innerWidth/window.innerHeight>=0.5){
				return fixStyle+'';
			}
			return fixStyle;//+`<style type="text/css">.vux-header{padding-top:30px !important;}.vux-header .vux-header-left, .vux-header .vux-header-right{top:44px !important;}</style>`;
		},
		style(){
			var css = `.weui-btn_primary {background-color: ${this.site.style} !important;}
			.weui-cell__ft .link{color: ${this.site.style} !important;}
			.weui-tabbar__item.weui-bar__item_on .weui-tabbar__icon, .weui-tabbar__item.weui-bar__item_on .weui-tabbar__icon > i, .weui-tabbar__item.weui-bar__item_on .weui-tabbar__label{color: ${this.site.style} !important;}
			.vux-tab .vux-tab-item.vux-tab-selected{color: ${this.site.style} !important;}
			.vux-tab-ink-bar{background-color: ${this.site.style} !important;}
			.weui-switch:checked, .weui-switch-cp__input:checked ~ .weui-switch-cp__box{background-color: ${this.site.style} !important;border-color: ${this.site.style} !important;}
			.range-quantity{background-color: ${this.site.style} !important;}
			.vux-popup-header-right{color: ${this.site.style} !important;}
			.jt{border-left: 1.2em solid ${this.site.style}!important ;}
			.jt::after{ background-color: ${this.site.style} !important;}
			.flex-child{ background-color: ${this.site.style} !important;}
			.free::after  { background-color: ${this.site.style} !important; }
			.free::before{ border-top:0.5em solid ${this.site.style} !important; }
			.color{color: ${this.site.style} !important; }
			.upgradeone{ background-color: ${this.site.style} !important;}
			.weui-btn_plain-primary{color: ${this.site.style} !important; border: 1px solid ${this.site.style} !important; }
			.VIP_FREE { color: ${this.site.style} !important; }
			
			`;
			css = `<style type="text/css">${css}</style>`;
			return css;
			// .jt { border-left:25px solid ${this.site.style} !important;  }
			// .jt::after{background-color: ${this.site.style} !important;}
			// .btn { border:${this.site.style} solid 1px; !important; background-color: ${this.site.style} !important; }
			// .flexparent  {color:${this.site.style} !important; }
			// .flex-child{ background-color:${this.site.style} !important; }
			// .flex-demo {background-color: ${this.site.style} !important;}
			// .feilv{color:${this.site.style} !important; }
			// .upgradeone {background-color: ${this.site.style} !important;}
			// .upgrade  { border:${this.site.style} !important; }
		}
	},
	methods:{
		...mapActions(['loadBankList']),
		getSite(){   
			this.$axios.get('/api/site/'+location.hostname.replace(/\w+\./,'').replace(/\./g,'_')).then((res) => {
				this.site=res.data;
			}).catch((err) => {
				this.is_loading = false;
				if (err.response) {
				if (typeof(err.response.data) == 'object') {
					this.error_msg = err.response.data.message;
				} else {
					this.error_msg = err.response.data;
				}
				}
			})
		},
		back(){
			if(this.backUrl){
				this.go(this.backUrl,true);
			}else{
				this.$router.go(-1);
			}
		},
		wxInit(){
			let that = this;
			this.$axios.post('/api/weixin/ticket',{url:location.href}).then((res)=>{
			  let weixin_config = res.data;
			  // weixin_config.debug = true;
			   wx.config(weixin_config);
			   wx.ready(function() {
			    let share_msg = {
			      title: '送你1000元免息金，信用卡收款还款不用愁', // 分享标题
			      desc: '注册即送免息金，还有更多赚钱玩法，等你来体验！', // 分享描述
			      link: `https://wx.ark111.com/static/invite.html?u=${that.user.id}`, // 分享链接
			      imgUrl: 'https://wx.ark111.com/static/icon.png', // 分享图标
			      success: function() {
			        that.$vux.toast.show({ text: '分享成功', type: 'success' })
			      },
			      cancel: function() {
			        that.$vux.toast.show({ text: '您取消了分享', type: 'warn' })
			      }
			    }
			    wx.onMenuShareTimeline(share_msg);
			    wx.onMenuShareAppMessage(share_msg);
			    wx.onMenuShareQQ(share_msg);
			    wx.onMenuShareWeibo(share_msg);
			    wx.onMenuShareQZone(share_msg);
			  })
			})
    	}
	}
}

</script>
<style lang="less">
@import '~vux/src/styles/reset.less';
@import './style/base.less';

body,
#vux_view_box_body {
  background-color: #ededed;
}

html,
body {
  height: 100%;
  width: 100%;
  overflow-x: hidden;
}

.vux-header {
  background-color: #ededed !important;
}

.vux-header .vux-header-title {
  color: inherit!important;
}

.weui-tabbar {
  background-color: #f6f6f6 !important;
}

.record {
  text-align: center;
  display: inline-block;
  width: 100%;
}

.record .icon {
  font-size: 3em;
}

.icons {
  margin-right: 0.5em;
  font-size: 17px!important;
}

.vux-header .vux-header-left div.left-arrow:before {
  border-color: #000
}

</style>
