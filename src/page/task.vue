<template>
  <div id="task">
    <sticky scroll-box="vux_view_box_body" :offset="isWeixin?0:46" :check-sticky-support="false">
      <tab>
        <tab-item :selected="filter.status==null" @on-item-click="filter.status=null;filter.page=1;loadTasks(filter,true)">全部</tab-item>
        <tab-item :selected="filter.status==1" @on-item-click="filter.status=1;filter.page=1;loadTasks(filter,true)">进行中</tab-item>
        <tab-item :selected="filter.status==2" @on-item-click="filter.status=2;filter.page=1;loadTasks(filter,true)">已结束</tab-item>
        <tab-item :selected="filter.status==-2" @on-item-click="filter.status=-2;filter.page=1;loadTasks(filter,true)">已取消</tab-item>
      </tab>
    </sticky>
    <div class="no_record" v-if="tasks.length==0&&!is_loading">
      <div class="record">
        <i class="icon icon-zanwujilu"></i>
      </div>
      &nbsp;&nbsp;暂无记录
    </div>
    <group style="margin-bottom:6em">
      <template v-for="(item,index) in tasks">
        <cell :key="index" :title="cardName(item.card_id)" is-link :link="'/task/' + item.id">
          <span slot="inline-desc"><label v-if="item.date_list.length!=0">{{item.date_list[0]}} {{item.date_list[item.date_list.length-1]}}</label><label v-else>{{item.begin_date|date}} {{item.end_date|date}}</label></span>
          <i slot="icon" v-if="cards[item.card_id]" :class="['bank-icon','icon-' + cards[item.card_id].bank_key]" :style="'color:'+cards[item.card_id].color"></i>
          <div>{{item.total_money|money}}
            <br/><small>{{item.status_name}}</small></div>
        </cell>
      </template>
    </group>
    <div class="weui-tabbar" style="border-top:aliceblue;">
      <div style="margin: 10px;width: 100%;">
        <x-button :show-loading="btn_loading" type="primary" link="/task/add">新建还款计划</x-button>
      </div>
    </div>
  </div>
</template>
<script>
import { Group, XHeader, Card, Cell, Tab, TabItem, Box, XButton, Sticky } from 'vux'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'task_list',
  components: {
    Group,
    XHeader,
    Card,
    Cell,
    Tab,
    TabItem,
    Box,
    XButton,
    Sticky
  },
  data() {
    return {
      filter: { page: 1, status: null, order: '-created_at' },
      show_type: 2,
      scroll_top: 0,
      is_more: true,
      page: 1,
      is_loading: false
    }
  },
  created() {
    this.$store.commit('updatePageTitle', '还款计划');
    this.loadTasks(this.filter);
    document.getElementById('vux_view_box_body').addEventListener('scroll', () => {
      if (!document.querySelector('#task')) { return; }
      var scroll_obj = document.querySelector('#task').getBoundingClientRect();
      if (this.filter.page < this.total_page && scroll_obj.height + scroll_obj.top < document.getElementById('vux_view_box_body').offsetHeight) {
        this.filter.page += 1;
        this.loadTasks(this.filter);
      }
    });
  },
  computed: {
    ...mapGetters(['cards', 'tasks', 'token', 'total_page', 'bank_list', 'btn_loading']),
    isWeixin() {
      return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
    }
  },
  methods: {
    ...mapActions(['loadTasks']),
    inline_desc(begin_date, end_date) {
      // let _begin_date = this.filter.date(begin_date)
      // let _end_date = this.filter.date(end_date)
      // return _begin_date+' '+_end_date;
    },
    isShow(status) {
      if (this.filter.status == null) { return true; } else if (this.filter.status == 2 && (status < 0 || status == 2)) { return true; } else if (this.filter.status == status) { return true } else { return false }
    },
    taskIcon(status) {
      if (status == 2) {
        return 'weui-icon-success';
      }
      if (status == 1) {
        return 'weui-icon-waiting';
      } else if (status == 0) {
        return 'weui-icon-info';
      } else if (status < 0) {
        return 'weui-icon-warn';
      }
    },
    cardName(card_id) {
      var card = null;
      if (this.cards) {
        for (let _card in this.cards) {
          if (this.cards[_card].id == card_id) {
            card = this.cards[_card];
          }
        }
      }
      if (!this.$isNull(card)) {
        return card.name;
      }
      return '未知卡片';
    },
    footerButtons(item) {
      return [{
        style: 'primary',
        text: '查看详情',
        link: '/task/' + item.id
      }]
    }
  }
}

</script>
<style lang="less">


</style>
