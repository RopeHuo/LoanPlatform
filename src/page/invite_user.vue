<template>
  <div id="trade">
    <div class="no_record" v-if="invites.length==0&&!is_loading">
      <div class="record">
        <i class="icon icon-zanwujilu"></i>
      </div>
      &nbsp;&nbsp;暂无记录
    </div>
    <group v-if="invites.length>0">
      <group-title slot="title">手机号<span class="pull-right">注册时间</span></group-title>
      <template v-for="(item,index) in invites">
        <cell :title="item.mobile" :value="item.created_at|date" :key='index'></cell>
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
      show_type: -1,
      scroll_top: 0,
      is_more: true,
      is_loading: false,
      filter: {},
      page: 1,
      show:null,
    }
  },
  created() {
    this.$store.commit('updatePageTitle', '邀请记录');
    this.loadInvites();
    this.show_info();

    document.getElementById('vux_view_box_body').addEventListener('scroll', () => {
      if (!document.querySelector('#trade')) { return; }
      var scroll_obj = document.querySelector('#trade').getBoundingClientRect();
      if (this.is_more && scroll_obj.height + scroll_obj.top < document.getElementById('vux_view_box_body').offsetHeight) {
        this.page += 1;
        this.loadInvite();
      }
    });
  },
  computed: {
    ...mapGetters(['cards', 'invites', 'bank_list', 'btn_loading']),
    isWeixin() {
      return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
    }
  },
  methods: {
    ...mapActions(['loadInvites']),

    loadInvite() {
      this.is_loading = true;
        if(!this.page){return}
      this.$axios.get('/api/user/invited?order=-trade_time&page=' + this.page).then((res) => {
        this.is_loading = false;
        if (this.page == 1) {
          this.$store.commit('updateInvites', res.data);
        } else {
          this.is_more = res.headers['x-total-page'] > this.page;
          this.$store.commit('updateConcatInvites', res.data);
        }
      });
    },
    show_info() {
      this.$axios.get('/api/user/invited').then((res)=>{
        console.log( 23543 )
    });
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
