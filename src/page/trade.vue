<template>
  <div id="trade">
    <sticky scroll-box="vux_view_box_body" :offset="isWeixin?0:46" :check-sticky-support="false">
      <tab>
        <tab-item :selected="filter.trade_type==null" @on-item-click="selectedType(null)">全部</tab-item>
        <tab-item :selected="filter.trade_type==0" @on-item-click="selectedType(0)">收款</tab-item>
        <tab-item :selected="filter.trade_type==1" @on-item-click="selectedType(1)">还款</tab-item>
        <tab-item :selected="filter.trade_type==2" @on-item-click="selectedType(2)">消费</tab-item>
        <tab-item :selected="filter.trade_type==3" @on-item-click="selectedType(3)">提现</tab-item>
        <tab-item :selected="filter.trade_type==4" @on-item-click="selectedType(4)">充值</tab-item>
        <tab-item :selected="filter.trade_type==5" @on-item-click="selectedType(5)">分润</tab-item>
        <tab-item :selected="filter.trade_type==6" @on-item-click="selectedType(6)">服务费</tab-item>
        <tab-item :selected="filter.trade_type==7" @on-item-click="selectedType(7)">垫还</tab-item>
      </tab>
    </sticky>
    <div class="no_record" v-if="trades.length==0&&!is_loading">
      <div class="record">
        <i class="icon icon-zanwujilu"></i>
      </div>
      &nbsp;&nbsp;暂无记录
    </div>
    <group v-if="trades.length>0">
      <group-title slot="title">银行卡/时间<span class="pull-right">金额</span></group-title>
      <template v-for="(item,index) in trades">
        <cell :title="bankName(item.card_id)" :key="index" :is-link="item.card_id!=0||item.task_id!=0" :link="item.card_id!=0||item.task_id!=0?'/trade/'+item.id:''" :border-intent="false">
          <div slot="icon" style="margin-right:0.8em">{{$tradeTypeName(item.trade_type)}}</div>
          <div slot="default"><b>{{item.trade_type%2==0?'+':'-'}}{{item.money | money}}</b>
            <br/><small>{{item.status_name}}</small></div>
          <div slot="inline-desc">{{item.trade_time?item.trade_time:'' | dateTimeList}}</div>
        </cell>
      </template>
    </group>
  </div>
</template>
<script>
import { Group, GroupTitle, Cell, Tab, TabItem, Sticky } from 'vux'
import { mapGetters, mapActions } from 'vuex'

//收款','还款','消费','提现','充值','服务费','分润'  0-6
export default {
  name: 'trade',
  components: {
    Group,
    GroupTitle,
    Cell,
    Tab,
    TabItem,
    Sticky
  },
  data() {
    return {
      scroll_top: 0,
      is_more: true,
      is_loading: false,
      filter: { trade_type: null,page: 1, status: null, order: '-created_at' }
    }
  },
  created() {
    this.$store.commit('updatePageTitle', '交易记录');
    this.loadTrades(this.filter);
    document.getElementById('vux_view_box_body').addEventListener('scroll', () => {
      if (!document.querySelector('#trade')) { return; }
      var scroll_obj = document.querySelector('#trade').getBoundingClientRect();
      if (this.filter.page < this.total_page && scroll_obj.height + scroll_obj.top  < document.getElementById('vux_view_box_body').offsetHeight) {
        this.filter.page += 1;
        this.loadTrades(this.filter);
      }
    });
  },
  computed: {
    ...mapGetters(['cards', 'trades','total_page', 'btn_loading']),
    isWeixin() {
      return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
    }
  },
  methods: {
    ...mapActions(['loadTrades']),
    selectedType(trade_type){
      this.filter.trade_type = trade_type;
      this.filter.page = 1;
      this.loadTrades(this.filter);
    },
    statusName(status) {
      let name = '';
      if (status == 2) {
        name = '成功';
      } else if (status == -2) {
        name = '失败';
      } else if (status == 1) {
        name = '进行中';
      } else if (status == -1) {
        name = '中止';
      } else if (status == 0) {
        name = '初始状态';
      } else if (status == 3) {
        name = '已完成';
      } else if (status == -3) {
        name = '未完成';
      }
      return name;
    },
    bankName(card_id) {
      if (card_id) {
        if (!this.$isNull(this.cards) && this.cards[card_id]) {
          return this.cards[card_id].name;
        }
      }
      return '未知卡片';
    }
  }
}

</script>
<style lang="less">
.pull-right {
  float: right;
}

.green {
  color: green
}

.red {
  color: red
}

.icon-text {
  color: #fff;
  background-color: #f00;
  display: inline-block;
  width: 2.8em;
  text-align: center;
  margin-right: 0.3em;
  border-radius: 3px;
  font-size: 0.8em;
  line-height: 2em;
  overflow: hidden;
  height: 2em;
}

</style>
