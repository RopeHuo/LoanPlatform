<template>
    <div>
        <div v-if="card && !msg_data.show" class="trade-header">
            <group gutter="0">
                <cell :title="card.bank_name" :value="card.card_type==0?repayDay:'储蓄卡'">
                    <i slot="icon" v-if="card" :class="['bank-icon','icon-' + card.bank_key]" :style="'color:'+card.color"></i>
                    <div slot="inline-desc">{{is_number}}</div>
                </cell>
            </group>
            <!-- <box gap="10px 10px" v-if="card.card_type==0 && card.status==0">
        <x-button :show-loading="btn_loading" type="primary" is-link :link="'/task/add?card_id='+card.id">立即还款</x-button>
      </box> -->
            <group>
                <!-- <cell title="还款中" is-link :link="'/task/'+task.id" v-if="card.status>0 && task">
          <small>{{task.status_name}} / {{task.total_money | money}}</small>
        </cell> -->
                <cell title="账单日期" :value="card.bill_day?'每月'+card.bill_day+'日':'未设置'" v-if="card.card_type==0"></cell>
                <cell title="还款日期" :value="card.repay_day?'每月'+card.repay_day+'日':'未设置'" v-if="card.card_type==0"></cell>
                <cell title="设置结算卡" v-if="card.card_type==1" :value="settlement_value"></cell>
            </group>
            <group>
                <cell title="还款记录" v-if="card.card_type==0" :is-link="true" :link="'/task?card_id='+card.id"></cell>
                <cell title="交易记录" :is-link="true" :link="'/trade?card_id='+card.id"></cell>
                <cell title="提取现金" v-if="card.card_type==0" :is-link="true" :link="'/cash/card?card_id='+card.id"></cell>
            </group>
            <group>
                <cell title="提现至本卡" :is-link="true" :link="'/cash/money?card_id_1='+card.id"></cell>
                <cell title="编辑卡片" is-link :link="'/card/edit?id='+card.id"></cell>
                <cell title="解除绑定" is-link value="解除" @click.native="unBind"></cell>
            </group>
            <!-- <box gap="10px 10px">
        <x-button :show-loading="btn_loading" type="default" @click.native="unBind">解除绑定</x-button>
      </box> -->
        </div>
        <div class="weui-tabbar" style="border-top:aliceblue;" v-if=" card && !msg_data.show&&card.card_type==0 ">
            <div style="margin: 10px;width: 100%;">
                <x-button type="default" :link="'/task/'+task.id" v-if="card.status>0 && task">还款中</x-button>
                <x-button :show-loading="btn_loading" v-if="card.status==0" type="primary" is-link :link="'/task/add?card_id='+card.id">立即还款</x-button>
            </div>
        </div>
        <msg v-if="msg_data.show" :title="msg_data.title" :description="msg_data.description" :buttons="msg_data.buttons" :icon="msg_data.icon"></msg>
    </div>
</template>
<script>
import {
    cookie,
    XSwitch,
    Group,
    Box,
    Card,
    Cell,
    XButton,
    Msg
} from 'vux'
import {
    mapGetters,
    mapActions
} from 'vuex'
export default {
    name: 'login',
    components: {
        Group,
        XSwitch,
        Card,
        Box,
        Cell,
        XButton,
        Msg
    },
    data() {
        return {
            card_id: '',
            task: null,
            msg_data: {
                show: false,
                title: '',
                description: '',
                icon: 'success',
                buttons: [{
                    type: 'primary',
                    text: '返回卡包',
                    link: '/card'
                }, {
                    type: 'default',
                    text: '添加银行卡',
                    link: '/card/add'
                }]
            }
        }
    },
    created() {
        this.$store.commit('updatePageTitle', '银行卡详情');
        this.card_id = this.$route.params.id;
        this.loadCard(this.card_id);
    },
    computed: {
        ...mapGetters(['cards', 'user', 'tasks', 'bank_list', 'btn_loading']),
        card() {
            let _card = {};
            if (this.card_id && this.cards[this.card_id]) {
                _card = this.cards[this.card_id];
            }
            if (_card.card_type == 0 && _card.status > 0) {
                this.loadTask(_card.id);
            }
            return _card;
        },
        is_number() {
            let _number = ''
            if (this.card && this.card.number) {
                _number = '尾号 ' + this.card.number.substr(this.card.number.length - 4)
            }
            return _number;
        },
        repayDay() {
            var _result = '';
            if (this.card.repay_day) {
                var now = new Date();
                if (now.getDate() < this.card.repay_day) {
                    return '距还款日' + (this.card.repay_day - now.getDate()) + '天';
                }
            }
            return _result;
        },
        settlement_value() {
            if (this.card_id == this.user.card_id) {
                return '已设置'
            }
            return '未设置';
        }
    },
    methods: {
        ...mapActions(['loadCard']),
        loadTask(card_id) {
            if (this.tasks.length > 0) {
                for (let i in this.tasks[i]) {
                    if (this.card.id = this.tasks[i].card_id) {
                        this.task = this.tasks[i];
                        break;
                    }
                }
            }
            this.$axios.get('/api/tasks?page_size=1&card_id=' + card_id).then((res) => {
                this.$store.commit('updateBtnLoading', false);
                if (res.data.length > 0) {
                    this.task = res.data[0];
                }
            })
        },
        unBind(confirm) {
            if (this.card.status > 0) {
                this.$vux.toast.show({
                    text: '此卡的还款任务尚未完成，无法解绑！',
                    type: 'text',
                    time: 3000
                });
                return;
            }
            if (confirm != 1) {
                var that = this;
                this.$vux.confirm.show({
                    title: '解绑确认',
                    content: '确定解绑此银行卡吗？',
                    onConfirm() {
                        that.unBind(1);
                    }
                });
                return;
            }
            this.$store.commit('updateBtnLoading', true);
            this.$axios.delete('/api/cards/' + this.card_id).then((res) => {
                this.$store.commit('updateBtnLoading', false);
                this.$store.commit('removeCard', this.card_id);
                this.msg_data.title = '操作成功';
                this.msg_data.show = true;
                //this.msg_data.title = removes.data;
                this.$store.commit('updateBtnLoading', false);
            })
        },
        settlementBind(confirm) {
            if (this.card_id == this.user.card_id) {
                return;
            }
            if (confirm != 1) {
                var that = this;
                this.$vux.confirm.show({
                    title: '设置结算卡',
                    content: '确定设置此银行卡为结算卡吗？',
                    onConfirm() {
                        that.settlementBind(1);
                    }
                });
                return;
            }
            this.$store.commit('updateBtnLoading', true);
            this.$axios.post('/api/user/set/card', {
                card_id: this.card_id
            }).then((res) => {
                this.$vux.toast.show({
                    text: res.data,
                    type: 'success',
                    time: 3000
                });
                this.$router.replace('/me')
            })
        }
    }
}
</script>
<style lang="less">
.trade-header .weui-panel {
    text-align: center;
    padding: 0.5em 0;
}

.trade-header .weui-panel h1 {
    font-size: 3em;
    font-weight: normal;
}

.item-money {
    float: right
}

;
.trade-type-1 {
    color: green;
}

;
.trade-type-0 {
    color: red;
}

;
</style>
