<template>
  <div>
    <div class="trade-header">
      <card v-if="trade.money">
        <h3 slot="header">{{trade.trade_type_name}}</h3>
        <h1 slot="content">{{(trade.trade_type && trade.trade_type%2==0)?'+':'-'}}{{trade.money | money}}</h1>
        <small slot="footer">{{trade.status_name}}</small>
      </card>
      <group>
        <cell title="失败原因" v-if="trade.ext_info&&trade.ext_info.error_msg" :value="trade.ext_info.error_msg"></cell>
      </group>
      <group v-if="trade.trade_type==5||trade.trade_type==6||trade.trade_type==7">
        <cell title="还款银行卡" is-link :link="'/card/'+card.id" :value="card.name" v-if="trade.card_id && card"></cell>
        <cell title="所属还款计划" is-link :link="'/task/'+trade.task_id" v-if="trade.task_id&&trade.task_id!=0"></cell>
        <cell title="入账" value="余额" v-if="trade.trade_type==6"></cell>
        <cell title="扣款账户" value="余额" v-if="trade.trade_type==7"></cell>
      </group>
      <group v-if="trade.trade_type==4">
        <cell title="付款银行卡" is-link :link="'/card/'+card.id" :value="card.name" v-if="card"></cell>
        <cell title="相关还款计划" is-link :link="'/task/'+trade.task_id" v-if="trade.task_id"></cell>
        <cell title="服务费" :value="trade.fee|money" v-if="trade.fee"></cell>
        <cell title="实际到账" :value="(trade.money-trade.fee)|money" v-if="trade.fee"></cell>
        <cell title="入账" value="余额"></cell>
      </group>
      <group v-if="trade.trade_type==3">
        <cell title="提现银行卡" is-link :link="'/card/'+card.id" :value="card.name" v-if="card"></cell>
        <cell title="到账银行卡" is-link :link="'/card/'+card_1.id" :value="card_1.name" v-if="card_1"></cell>
        <cell title="服务费" :value="trade.fee|money" v-if="trade.fee"></cell>
        <cell title="实际到账" :value="(trade.money-trade.fee)|money" v-if="trade.fee"></cell>
      </group>
      <group v-if="trade.trade_type==0">
        <cell title="付款银行卡" is-link :link="'/card/'+card.id" :value="card.name" v-if="card"></cell>
        <cell title="到账银行卡" is-link :link="'/card/'+card_1.id" :value="card_1.name" v-if="card_1 && card_1.name"></cell>
        <cell title="服务费" :value="trade.fee|money" v-if="trade.fee"></cell>
        <cell title="实际到账" :value="(trade.money-trade.fee)|money" v-if="trade.fee"></cell>
      </group>
      <group v-if="trade.trade_type==1">
        <cell title="所属还款计划" is-link :link="'/task/'+trade.task_id" v-if="trade.task_id&&trade.task_id!=0"></cell>
        <cell title="还款信用卡" is-link :link="'/card/'+card.id" :value="card.name" v-if="card"></cell>
        <cell title="服务费" :value="trade.fee|money" v-if="trade.fee"></cell>
      </group>
      <group v-if="trade.trade_type==2">
        <cell title="所属还款计划" is-link :link="'/task/'+trade.task_id" v-if="trade.task_id&&trade.task_id!=0"></cell>
        <cell title="消费银行卡" is-link :link="'/card/'+card.id" :value="card.name" v-if="card"></cell>
        <cell v-if="channel.can_select_shop == 1"  title="商户" :value="trade.shop_id?trade.shop_name:'未选择'" :link="'/shop?url=/trade/'+trade.id+'&channel_id='+trade.channel_id"></cell>
        <cell title="服务费" :value="trade.fee|money" v-if="trade.fee"></cell>
      </group>
      <group>
        <cell title="创建时间"><small>{{trade.created_at|dateTime}}</small></cell>
        <cell title="订单号"><small>{{trade.id}}</small></cell>
        <cell title="商户单号" v-if="trade.order_id"><small>{{trade.order_id}}</small></cell>
        <cell title="银行单号" v-if="trade.trace_id"><small>{{trade.trace_id}}</small></cell>
      </group>
      <group>
        <cell title="对止有疑问" value="联系客服" is-link link="/kefu"></cell>
      </group>
      <div class="weui-tabbar" v-if="$route.query.shop_id&&trade.trade_type==2" style="border-top:aliceblue;">
        <div style="margin: 10px;width: 100%;">
          <x-button :disabled="!$route.query.shop_id" type="primary" @click="revise">确认修改</x-button>
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { Group, Card,XButton, Cell } from 'vux'
import { mapGetters, mapActions } from 'vuex'
//type_list= ['收款','还款','消费','提现','充值','冻结','解冻','服务费','外块']
//收款','还款','消费','提现','充值','服务费','分润'  0-6
export default {
  name: 'login',
  components: {
    Group,
    Card,
    XButton,
    Cell
  },
  data() {
    return {
      shop:{
        id:'',
        name:''
      },
      trade: { trade_id: '' },
      card: null,
      card_1: null,

    }
  },
  created() {
    this.$store.commit('updatePageTitle', '详情');
    this.trade.trade_id = this.$route.params.id;
    this.shop.id = this.$route.query.shop_id ||'';
    this.shop.name = this.$route.query.shop_name ||'';
    if (this.tasks.length > 0) {
      for (let i in this.tasks) {
        if (this.tasks[i].id == this.trade.trade_id) {
          this.trade = this.tasks[i];
          break;
        }
      }
    }
    this.loadTrade(this.trade.trade_id);
  },
  computed: {
    ...mapGetters(['cards', 'tasks', 'btn_loading','channels']),
    channel(){
      let _channel = {};
      _channel.id = this.trade.channel_id;
      for(let i in this.channels){
        let item = this.channels[i];
        if(item.id == _channel.id){
          _channel = item;
        }
      }
      return _channel;
    }
  },
  methods: {
    revise(){
      this.tasks.shop_id = this.shop.id;
      this.$axios.put('/api/trades/', this.trade).then((res) => {
          this.card = res.data;
          this.$store.commit('addCard', this.card);
        })
    },
    loadCard(card_id) {
      if (!this.$isNull(this.cards)) {
        this.card = this.cards[card_id];
      }
      if (this.$isNull(this.card)) {
        this.$axios.get('/api/cards/' + card_id).then((res) => {
          this.card = res.data;
          this.$store.commit('addCard', this.card);
        })
      }
    },
    loadCard_1(card_id) {
      if (!this.$isNull(this.cards)) {
        this.card_1 = this.cards[card_id];
      }
      if (this.$isNull(this.card_1)) {
        axios.get('/api/cards/' + card_id).then((res) => {
          this.card_1 = res.data;
          this.$store.commit('addCard', this.card_1);
        })
      }
    },
    loadTrade(trade_id) {
      this.$axios.get('/api/trades/' + trade_id).then((res) => {
        this.trade = res.data;
        if(this.$route.query.shop_id){
          this.trade.shop_id = this.$route.query.shop_id ||'';
          this.trade.shop_name = this.$route.query.shop_name ||'';
        }
        if (this.trade.card_id) {
          this.loadCard(this.trade.card_id);
        }
        if (this.trade.trade_type == 0 && this.trade.ext_info) {
          this.loadCard_1(this.trade.ext_info.card_id_1);
        }
      })

    },
  }
}

</script>
<style lang="less">


</style>
