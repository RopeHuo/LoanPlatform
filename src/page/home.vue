<template>
  <div>
    <div :class="[isShow?'isShow':'']" @click="isShow=false">
      <img style="width: 80%;margin-left: 4em;margin-top: 2em;" src="../../static/img/yaoqing.png" v-if="isShow">
    </div>
    <div class="home-header">
      <flexbox align="center">
          <flexbox-item><router-link to="/cash/card"><i class="icon icon-shoukuan"></i><label>收款</label></router-link></flexbox-item>
          <flexbox-item><router-link to="/task/add"><i class="icon icon-huankuan"></i><label>还款</label></router-link></flexbox-item>
      </flexbox>
    </div>

    <group>
      <cell title="我的卡包">
        <router-link to="/card" class="link">全部</router-link> | <router-link to="/card/add?step=0" class="link">添卡</router-link>
      </cell>
      <template v-for="(item,key) in card_list">
        <cell :key="key" v-if="item.status>=0 && item.number" :title="item.bank_name" :inline-desc="(item.card_type==0?'信用卡（':'储蓄卡（') + item.number.substr(item.number.length-4) +'）'" is-link :link="'/card/'+item.id">
          <i slot="icon" v-if="item.bank_key" :class="['bank-icon','icon-' + item.bank_key]" :style="'color:'+item.color"></i>
          <label>{{repayDay(item)}}</label>
        </cell>
      </template>
      <box gap="1em 10px" v-if="card_count>show_count">
        <x-button link="/card">全部{{card_count}}张卡片</x-button>
      </box>

      <box gap="1em 0 2em 0" v-if="card_count==0" class="box">
        <router-link to="/card/add?step=0"><i class="icon icon-add"></i></router-link>
        <!-- <x-button link="/card/add?step=0">添加银行卡</x-button> -->
      </box>
    </group>

    <confirm
      v-model="showQrcode"
      :show-cancel-button="false"
      title="分享二维码">
      <qrcode value="qrcode" type="img"></qrcode>
    </confirm>
    
    <div style="margin: 10px;"  @click="showMask">
      <img src="/static/img/fenxian_1.png" width="100%">
    </div>

  </div>
</template>

<script>
import { cookie, Cell, Group,Box,XButton,Confirm,Qrcode, Flexbox,FlexboxItem  } from 'vux'
import axios from 'axios'
import { mapGetters, mapActions } from 'vuex'

export default {
  	name: 'me',
    components: {
      Cell, Group,Box,XButton,Confirm,Qrcode, Flexbox,FlexboxItem
    },
    data(){
      return {
        showQrcode:false,
        isShow:false,
        card_count:0,
        show_count:5,
      }
    },
    computed:{
      ...mapGetters(['user','cards','token','btn_loading']),
      card_list(){
        var _card_list = [];
        for(var card_id in this.cards){
          if(_card_list.length>=this.show_count){
            break;
          }
          var _card = this.cards[card_id];
          _card_list.push(_card);
        }
        this.card_count = Object.keys(this.cards).length;
        return _card_list;
      }
    },
  	created(){
      this.$store.commit('updatePageTitle','银掌通');
      if(this.token){
        this.loadUser();
        this.loadCards();
      }
  	},
    methods:{
       ...mapActions(['loadUser','loadCards']),
     showMask(){
       this.go('/cash/card?channel_id=35')
      // if(window.navigator.userAgent.indexOf('MicroMessenger')!=-1){
      //   this.isShow=true;
      // }else{
      //   this.showQrcode = true;
      // }
      
     },
      repayDay(card){
        var _result = '';
        if(card.status==2){
          _result = '还款中';
        }else if(card.status==1){
          _result = '还款未启动';
        }else if(card.repay_day){
          var now = new Date();
          if(now.getDate() < card.repay_day){
            _result = '距还款日' + (card.repay_day - now.getDate()) + '天';  
          }
        }
        if(card.card_type==1&&card.id == this.user.card_id){
          _result = '结算卡';
        }
        return _result;
      },
    },
    wacth:{
      cards(cur,old){
        this.card_count = Object.keys(cur).length;
      }
    }
}

</script>

<style lang="less">
.box{text-align: center;}
.box .icon{font-size: 2em}
.home-header{background-color:#17CB5F;padding:1.3em 0;}
.home-header .icon{font-size:3em;display:block;}
.home-header label{margin-top:-0.5em;color: #fff}
.home-header .vux-flexbox{text-align:center;} 

.isShow {
  background: #000;
  width: 100%;
  height: 100%;
  position: absolute;
  z-index: 1000;
  opacity:0.7;
  /*background: url('../../static/fenxian.png');*/
}
</style>
