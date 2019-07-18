<template>
  <div>
    <div v-if="step==0">
      <div class="trade-header">
        <card>
          <h3 slot="header">账户可用余额</h3>
          <h1 slot="content">￥{{user.money|money}}</h1>
        </card>
      </div>
      <group title="任务执行条件" v-if="task && need_money > 0">
        <cell title="卡片可用额度不低于" :value="task.need_money | money"></cell>
        <cell title="应收服务费" :value="task.fee | money"></cell>
      </group>
      <group>
        <x-input class="task_money" :disabled="true" text-align="center" type="number" placeholder="请输入充值金额" :debounce="1000" v-model="post_data.money" @on-change="changeMoney"></x-input>
        <cell-form-preview v-if="fee>0" :list="money_list"></cell-form-preview>
      </group>
      <group>
        <cell v-if="post_data.channel_id&&post_data.can_select_shop==1" title="商户" :value="shop.name?shop.name:'未选择'" :link="'/shop?url=/pay&channel_name='+post_data.channel_name+'&channel_id='+post_data.channel_id"></cell>
        <cell title="付款信用卡" @click.native="is_popup=true" is-link>
          <span v-if="card">
           {{card.name}}
          </span>
        </cell>
        <popup-picker title="信用卡" v-model="popup_data.card_select" :data="card_list" @on-change="loadCard" style="display:none" :show="is_popup" @on-hide="is_popup=false" placeholder="请选信用卡" popup-title="请选信用卡"></popup-picker>
        <template v-if="card && !card.is_valid">
          <x-input text-align="right" type="text" :max="4" title="有效期" placeholder="MMYY 例:0621" v-model="post_data.expire_time"></x-input>
          <x-input text-align="right" type="text" :max="3" title="校验码" placeholder="CVV2 背面签名栏最后3位数字" v-model="post_data.safe_code"></x-input>
        </template>
        <x-input title="到账金额" text-align="right" :show-clear="false" placeholder="0.00" type="number" :readonly="arrival_money_readonly" v-model="post_data.arrival_money">
          <div slot="right" @click="confirmMsg('arrival_money');arrival_money_readonly=false">
            <icon type="info-circle"></icon>
          </div>
        </x-input>
        <cell title="服务费" is-link :arrow-direction="is_fee?'up':'down'" @click.native="is_fee = !is_fee" :value="post_data.fee | money">
          <div slot="right" @click="confirmMsg('fee')">
            <icon type="info-circle"></icon>
          </div>
        </cell>
        <cell-form-preview v-if="is_fee" :list="fee_list"></cell-form-preview>
      </group>
      <group v-if="user.safe_pay">
        <x-input text-align="right" :type="show_password?'number':'password'" :show-clear="false" title="支付密码" placeholder="请输入6位数字支付密码" v-model="post_data.pay_password">
          <i slot="right" :class="[show_password?'icon-show':'icon-hide','icon']" @click="show_password=!show_password"></i>
        </x-input>
      </group>
      <box gap="10px 10px">
        <x-button :show-loading="btn_loading" type="primary" @click.native="doPay">{{task_id?'启动计划':'确定'}}</x-button>
      </box>
      <confirm v-model="confirm_data.model" :title="confirm_data.title" :show-cancel-button="false">
        <img width="200px" height="115px" v-if="confirm_data.img" :src="confirm_data.img">
        <p v-html="confirm_data.text"></p>
      </confirm>
    </div>
    <msg v-if="step==1" :title="msg_data.title" :description="msg_data.description" :buttons="msg_data.buttons" :icon="msg_data.icon"></msg>
  </div>
</template>
<script>
import { cookie, Cell, Card, CellFormPreview,Icon, Confirm, Group, PopupPicker, Msg, Box, XButton, XInput } from 'vux'
import { mapGetters, mapActions } from 'vuex'

export default {
  name: 'pay',
  data() {
    return {
      id: '',
      trade_type: 'card',
      shop:{
          id:'',
          name:''
      },
      confirm_data: { title: '说明', model: false, text: '', img: '' },
      post_data: {
          channel_id:'',
          can_select_shop:'',
          channel_name:'', 
          expire_time: '', 
          safe_code: '',
          money: null, 
          card_id: '', 
          trade_type: 4, 
          pay_password: '' 
      },
      popup_data: { card_select: [] },
      step: 0,
      money: null,
      need_money: 0,
      is_fee: false,
      arrival_money_readonly: true,
      fee: 0,
      task: {},
      card: {},
      task_id: '',
      is_popup: false,
      show_password: false,
      is_loading: false,
      msg_data: {
        title: '',
        description: '',
        buttons: [{
          type: 'primary',
          text: '查看交易详情',
          link: '/trade/' + this.id
        }, {
          type: 'default',
          text: '返回我的账户',
          link: '/me'
        }]
      }
    }
  },
  components: {
    Cell,Icon,
    Card,
    CellFormPreview,
    Confirm,
    Group,
    PopupPicker,
    Msg,
    Box,
    XButton,
    XInput
  },
  computed: {
    ...mapGetters(['user', 'cards', 'config', 'bank_list', 'btn_loading']),
    is_card() {
      let _is_card = true;
      for (let _card_id in this.cards) {
        let _card = this.cards[_card_id];
        if (_card.card_type == 0 && _card.status == 0) { //可用的信用卡
          _is_card = false;
          break;
        }
      }
      return _is_card;
    },
    collect_config() {
      let config = {};
      if(this.$route.query.count_fee||this.$route.query.rate_fee){
          config.count_fee = this.$route.query.count_fee||this.config.collect.count_fee;
          config.rate_fee = this.$route.query.rate_fee||this.config.collect.rate_fee;
      }else{
          config = this.config.collect || {}
      }
      return config;
    },
    fee_list() {;
      return [{ label: `服务费 = 充值金额 x ${(this.collect_config.rate_fee*100).toFixed(2)}% + ${(this.collect_config.count_fee*1).toFixed(2)}/笔` }]
    },
    card_list() {
      var _card_list = [];
      for (let _card_id in this.cards) {
        let _card = this.cards[_card_id];
        if (_card.card_type == 0) {
          if (!this.post_data.card_id && _card.status == 0) {
            this.post_data.card_id = _card.id;
            this.popup_data.card_select = [_card.id];
          }
          _card_list.push({ 'name': (_card.status != 0 ? '执行中:' : '') + _card.name, 'value': _card.id });
        }
      }
      _card_list.push({ 'name': '+添加信用卡', 'value': '0' })
      return [_card_list] || [];
    },
    task_money_list: function() {
      var money_list = [];
      if (this.task.need_money > this.user.locked_money) {
        money_list.push({ label: "冻结余额", value: (this.task.need_money*1 - this.user.locked_money*1).toFixed(2) });
      }
      money_list.push({ label: "扣除服务费", value: (this.task.fee*1).toFixed(2) });
      return money_list;

    },
    collect_config() {
      return this.config.collect || {};
    },
    money_list: function() {
      if (!this.money) { return []; }
      var money = parseFloat(this.money);
      if (this.trade_type == 'card' || money + this.fee > this.user.money) {
        money = this.money - this.fee;
      }
      return [{ label: "服务费", value: (this.fee*1).toFixed(2) },
        { label: "实际到账", value: (money*1).toFixed(2) }
      ]
    },
    cash_fee: function() {
      var _fee = '';
      if (this.collect_config.rate_fee > 0) {
        _fee += this.collect_config.rate_fee * 100 + '% + ';
      }
      _fee += (this.collect_config.count_fee*1).toFixed(2) + '/笔';

      return _fee;
    },
  },
  updated() {

  },
  created() {
    this.$store.commit('updatePageTitle', '充值');
    this.post_data.card_id = this.$route.query.card_id;
    this.post_data.money = this.$route.query.money || '';
    this.shop.id = this.$route.query.shop_id || '';
    this.shop.name = this.$route.query.shop_name || '';
    if (this.$isNull(this.card_list) || this.card_list[0].length <= 1 || !this.post_data.card_id) {
      let self = this;
      self.$vux.confirm.show({
        title: '添加卡片',
        content: '暂无可用的信用卡，请立即添加',
        confirm_text: '前往',
        onCancel() {
          if (!self.post_data.card_id && self.card_list[0].length <= 1) {
            self.$router.replace('/');
          }
        },
        onConfirm() {
          self.$db.set('path', { path: '/pay', data: { status: 0, msg: '添加银行卡充值' } })
          self.$router.replace('/card/add?step=0');
        }
      })
      return;
    }

    if (this.is_card) {
      let self = this;
      self.$vux.confirm.show({
        title: '添加卡片',
        content: '暂无可用的信用卡，请立即添加',
        confirm_text: '添加',
        onCancel() {},
        onConfirm() {
          self.$db.set('path', { path: '/pay', data: { status: 0, msg: '添加信用卡充值' } })
          self.$router.replace('/card/add?step=0');
          self.task_add = false;
        }
      })
      return;
    }
    if (this.post_data.card_id) {
      this.popup_data.card_select[0] = this.post_data.card_id;
    }
    this.loadConfig();
  },
  mounted() {
     setTimeout(function(){document.querySelector('.weui-input').focus();document.querySelector('.weui-input').focus();},1000);
  },
  watch: {
    "popup_data.card_select" (cur, old) {
      this.post_data.card_id = cur[0];
    },
    "post_data.money" (cur, old) {
      this.post_data.fee = cur * (this.collect_config.rate_fee) + (this.collect_config.count_fee * 1); 
      this.post_data.arrival_money = (cur*1-this.post_data.fee*1).toFixed(2);
    },
  },
  methods: {
    confirmMsg(type) {
      this.confirm_data.model = true;
      if (type == 'expire_time') { //有效期说明
        this.confirm_data.img = `/static/img/${type}.jpg`;
        this.confirm_data.title = '有效期说明';
        this.confirm_data.text = '';
      } else if (type == 'safe_code') { //校验码说明
        this.confirm_data.img = `/static/img/${type}.jpg`;
        this.confirm_data.title = '校验码说明';
        this.confirm_data.text = '';
      } else if (type == 'fee') { //服务费说明
        this.confirm_data.title = '服务费说明';
        this.confirm_data.text = '还款金额*费率+拆分次数';
      } else if (type = 'arrival_money') {
        this.confirm_data.title = '到账金额说明';
        this.confirm_data.text = '到账金额 = 收款金额 - 服务费(收款金额*' + (this.trade_type == 'card' ? this.collect_config.rate_fee : this.cash_config.rate_fee) + ' + ' + (this.trade_type == 'card' ? this.collect_config.count_fee : this.cash_config.count_fee) + ')';
      }
    },
    doPay() {
      if (this.is_loading) { return; }
      this.is_loading = true;
      if (this.popup_data.card_select[0]) {
        cookie.set('card_id', this.popup_data.card_select[0], { expires: 30 });
      }
      if (this.task && this.task.fee) {
        if (this.money < this.need_money) {
          this.$vux.toast.show({ text: '请至少充值' + (this.need_money*1).toFixed(2) + '元才可以启动该计划', type: 'text', time: 3000 });
          return;
        }
        this.post_data['task_id'] = this.task.id;
      }
      axios.post('/api/trades', this.post_data).then((res) => {
        this.is_loading = false;
        this.id = res.data.id;
        this.msg_data.title = '操作成功';
        this.msg_data.description = '充值到账可能会有1-5分钟延迟';
        if (this.task) {
          this.msg_data.description += ',还款任务将会自动开始执行';
          this.task.status = 1;
          this.card.status = 2;
          this.$store.commit('addTask', this.task);
        }
        this.card.is_valid = true;
        this.$store.commit('addCard', this.card);

        this.msg_data.buttons[0].link = '/trade/' + this.id;

        if (!this.user.safe_pay) {
          this.msg_data.buttons[1].text = '设置支付密码';
          this.msg_data.buttons[1].link = '/password/pay';
        }
        this.step = 1;
      }).catch((e) => { this.is_loading = false; });
    },
    initPay() {
      if (!this.task_id || !this.task) { return; }
      if (this.task.card_id == this.card.id) {
        var card_item = { 'name': this.card.name, 'value': this.card.id };
        if (this.card_list.length > 0) {
          var has_card = false;
          for (var item in this.card_list[0]) {
            if (this.card_list[0][item].value == this.card.id) {
              has_card = true;
              break;
            }
          }
          if (!has_card) {
            this.card_list[0].push(card_item);
          }
        } else {
          this.card_list = [
            [card_item]
          ];
        }
      }
      this.popup_data.card_select[0] = this.task.card_id;
      var need_money = this.task.fee;
      if (this.user.money < need_money) {
        this.need_money = need_money - this.user.money;
        this.need_money = this.need_money / (1 - this.collect_config.rate_fee)*1 + this.collect_config.count_fee*1;
        this.money = Math.ceil(this.need_money);
        if (this.money < this.collect_config.min_money && !this.task) {
          this.money = this.collect_config.min_money;
        }
      } else {
        this.money = null;
      }
    },
    loadTask(task_id) {
      this.task_id = task_id;
      this.task = this.tasks[task_id];
      if (!this.task) {
        axios.get('/api/tasks/' + task_id).then((res) => {
          this.task = res.data[task_id];
          this.loadCard(this.task.card_id);
          this.$store.commit('addTask', this.task);
          // this.$vux.toast.show({text:res.data,type:'warn'});
          // return;
        })
      } else {
        this.loadCard(this.task.card_id);
      }
    },
    loadCard: function(card_id) {
      if (!card_id) {
        card_id = this.popup_data.card_select[0];
      }
      if (!card_id) { return; }
      if (!this.$isNull(this.cards[card_id])) {
        this.card = this.cards[card_id];
      }
      if (!this.$isNull(this.card)) {
        this.initPay();
      } else {
        axios.get('/api/cards/' + card_id).then((res) => {
          this.card = res.data[card_id];
          this.$store.commit('addCard', this.card);
          this.initPay();
          // this.$vux.toast.show({text:res.data,type:'warn'});
        });
      }
    },
    loadConfig() {
      var task_id = this.$route.query.task_id;
      if (this.collect_config) {
        if (task_id) {
          this.loadTask(task_id);
        } else {
          this.loadCard();
        }
      } else {
        axios.get('/api/user/config').then((res) => {
          this.$store.commit('updateConfig', res.data);
          this.user.locked_money = res.locked_money;
          if (task_id) {
            this.loadTask(task_id);
          } else {
            this.loadCard();
          }
          //this.$vux.toast.show({text:res.data,type:'warn'});
        });
      }
    },
    changeMoney() {
      this.fee = this.collect_config.count_fee + this.money * this.collect_config.rate_fee;
      if (this.task && this.task.fee) {
        if (this.money > 0 && this.need_money && this.money < this.need_money) {
          this.$vux.toast.show({ text: '请至少充值' + (this.need_money*1).toFixed(2) + '元才可以启动该计划', type: 'text', time: 3000 });
          this.money = null;
          this.fee = 0;
          return;
        }
      } else {
        if (this.money > 0 && this.money < this.collect_config.min_money) {
          this.$vux.toast.show({ text: '最低充值金额不能少于' + (this.collect_config.min_money*1).toFixed(2), type: 'text', time: 3000 });
          this.money = null;
          this.fee = 0;
          return;
        }
      }
    }
  }
}

</script>
<style lang="less">
.task_money input {
  font-size: 2em;
}

.task_money input::-webkit-input-placeholder {
  color: #aab2bd;
  font-size: 0.6em;
  font-weight: 100;
}

</style>
