<template>
  <div>
    <sticky scroll-box="vux_view_box_body" :offset="isWeixin?0:46" :check-sticky-support="false">
      <tab>
        <!-- <tab-item :selected="filter.status==0" @on-item-click="filter.status=0;loadCoupons(filter)">未激活</tab-item> -->
        <tab-item :selected="filter.status==1" @on-item-click="filter.status=1;loadCoupons(filter)">未使用</tab-item>
        <tab-item :selected="filter.status==2" @on-item-click="filter.status=2;loadCoupons(filter)">已使用</tab-item>
        <tab-item :selected="filter.status==-1" @on-item-click="filter.status=-1;loadCoupons(filter)">已过期</tab-item>
      </tab>
    </sticky>
    <div class="no_record" v-if="coupons.length==0&&!is_loading">
      <div class="record">
        <i class="icon icon-zanwujilu"></i>
      </div>
      &nbsp;&nbsp;暂无记录
    </div>
    <div class="coupon" v-for="item in coupons" @click="detile">
      <div :class="['coupon_status',item.status==1?'status_0':'status_-1']">
        <span v-if="item.amount">￥<b :style="{'font-size':item.amount.split('.')[0].length<=4?'2.5em':'2.2em'}">{{item.amount.split('.')[0]}}</b></span>
        <p>可抵消利息</p>
      </div>
      <div class="coupon_money">
        <b>{{item.name}}</b>
        <span>有效期至：{{item.expire_time?item.expire_time:'永久有效'}}</span>
      </div>
    </div>
  </div>
</template>
<script>
import { Group, XHeader, Card, Cell, Tab, TabItem, Box, XButton, Sticky } from 'vux'
import axios from 'axios'
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
      show_type: 2,
      scroll_top: 0,
      is_more: true,
      is_loading: false,
      page: 1,
      filter: {}
    }
  },
  created() {
    this.filter.status = 1
    this.loadCoupons(this.filter);
    this.$store.commit('updatePageTitle', '优惠券');
    document.getElementById('vux_view_box_body').addEventListener('scroll', () => {
      var scroll_obj = document.querySelector('#vux_view_box_body div').getBoundingClientRect();
      if (this.is_more && scroll_obj.height + scroll_obj.top < document.getElementById('vux_view_box_body').offsetHeight) {
        this.page += 1;
        this.loadTasks();
      }
    });
    if (this.token) {
      this.loadTasks();
    }
  },
  computed: {
    ...mapGetters(['cards', 'tasks', 'token', 'bank_list', 'coupons', 'btn_loading']),
    isWeixin() {
      return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
    }
  },
  methods: {
    ...mapActions(['loadTasks', 'loadCoupons']),

    detile() {}
    // loadTask(){
    //   if(!this.tasks){
    //     this.$store.commit('updateBtnLoading',true);
    //   }
    //   this.$axios.get('/api/tasks').then((res)=>{
    //       this.$store.commit('updateBtnLoading',false);
    //        if(this.page == 1){
    //         this.$store.commit('updateTasks',res.data);
    //         //this.$store.commit('updatePageCount', { key: 'users', val: res.headers });
    //       }else {
    //         this.is_more  = res.headers['x-total-page']>this.page;        
    //         this.tasks = this.tasks.concat(res.data); //store的数据不能直接赋值
    //       }
    //   })
    // }
  }
}

</script>
<style>
.coupon {
  height: 6em;
  width: 94%;
  margin: auto;
  margin-top: 1em;
  display: flex;
  background: #fff;
}

.status_-1 {
  background: #999;
}

.status_0 {
  background: red;
}

.coupon_status {
  width: 28%;
  border-left: 4px dotted #fff;
}

.coupon_status span {
  margin-top: 1em;
  display: block;
  color: #fff;
  font-size: 0.7em;
  text-align: center;
}

.coupon_status b {
  font-size: 2em;
  letter-spacing: 2px;
}

.coupon_status p {
  color: #fff;
  font-size: 0.7em;
  text-align: center;
}

.coupon_money b {
  display: block;
  margin-top: 1em;
  padding-left: 1em;
  color: #666;
  letter-spacing: 2px;
}

.coupon_money span {
  display: block;
  margin-top: 1em;
  font-size: 0.8em;
  padding-left: 1em;
  color: #666
}

</style>
