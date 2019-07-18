<template>
    <div>
        <div v-if="step==0">
            <group v-if="trade_type=='card'">
                <cell :title="card?card.bank_name:'请选择银行卡'" :value="card_name" inline-desc="信用卡" @click.native="is_popup=true" :is-link="!id">
                    <i slot="icon" v-if="card" :class="['bank-icon','icon-' + card.bank_key]" :style="'color:'+card.color"></i>
                </cell>
                <popup-picker title="提现信用卡" v-model="popup_data.card_select" :data="card_list" style="display:none" :show="!id && is_popup" @on-hide="is_popup=false" placeholder="请选信用卡" popup-title="请选信用卡"></popup-picker>
                <div v-if="card && !card.is_valid">
                    <x-input text-align="right" :show-clear="false" type="number" :max="4" title="有效期" placeholder="示例:04/25,输入0425" v-model="post_data.expire_time">
                        <div slot="right" @click="confirmMsg('expire_time')">
                            <icon slot="right" type="info-circle"></icon>
                        </div>
                    </x-input>
                    <x-input text-align="right" :show-clear="false" type="number" :max="3" title="校验码" placeholder="卡背面末3位" v-model="post_data.safe_code">
                        <div slot="right" @click="confirmMsg('safe_code')">
                            <icon type="info-circle"></icon>
                        </div>
                    </x-input>
                </div>
            </group>
            <div class="trade-header">
                <card v-if="trade_type!='card' && user">
                    <h3 slot="header">可用余额</h3>
                    <h1 slot="content">￥{{user.money }}</h1>
                </card>
            </div>
            <group>
                <x-input class="task_money" text-align="center" :show-clear="false" type="number" :debounce="1000" :placeholder="cashName" v-model="post_data.money" @on-change="changeMoney">
                    <div slot="right" v-if="trade_type!='card'" class="link" @click="post_data.money=user.money">全部</div>
                </x-input>
                <cell title="通道" :value="post_data.channel_id&&post_data.channel_name?post_data.channel_name:'未选择'" :link="'/channel?url=/cash/card&channel_id='+post_data.channel_id"></cell>
              <cell v-if="post_data.channel_id&&post_data.can_select_shop==1" title="商户" :value="post_data.shop_id&&post_data.shop_name?post_data.shop_name:'未选择'" :link="'/shop?url=/cash/card&channel_id='+post_data.channel_id+'&channel_name='+post_data.channel_name"></cell>
                <popup-picker title="到账银行卡" v-model="popup_data.card_select_1" :data="card_list_1" :show-name="true" placeholder="请选择到账银行卡" popup-title="请选择到账银行卡"></popup-picker>
                <popup-picker title="红包" :data="coupon_list" v-model="popup_data.coupon" :columns="2" :fixedColumns="2" :placeholder="coupon_status" popup-title="请选择红包" :display-format="feeType" :disabled="coupon_list.length<=1"></popup-picker>
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
                <x-input text-align="right" :type="show_password?'number':'password'" :show-clear="false" title="支付密码" placeholder="请输入位数字支付密码" v-model="post_data.pay_password">
                    <i slot="right" :class="[show_password?'icon-show':'icon-hide','icon']" @click="show_password=!show_password"></i>
                </x-input>
            </group>
            <box gap="10px 10px">
                <x-button :show-loading="btn_loading" :disabled="post_data.arrival_money>0?false:true" type="primary" @click.native="doTrade">确定</x-button>
            </box>
        </div>
        <confirm v-model="confirm_data.model" :title="confirm_data.title" :show-cancel-button="false">
            <img width="200px" height="115px" v-if="confirm_data.img" :src="confirm_data.img">
            <p v-html="confirm_data.text"></p>
        </confirm>
        <confirm v-model="is_valicode" :close-on-confirm="false" title="验证码" @on-confirm="doTrade()" @on-cancel="is_valicode=false">
            <div>
                <group>
                    <x-input type="number" id="valicode" placeholder="请输入短信验证码" :show-clear="false" v-model="post_data.sms_code"></x-input>
                </group>
            </div>
        </confirm>
        <loading :show="status_205_data.show" :text="status_205_data.msg"></loading>
        <msg v-if="step==1" :title="msg_data.title" :description="msg_data.description" :buttons="msg_data.buttons" :icon="msg_data.icon"></msg>
        <popup v-model="iframe" width="100%" height="100%" position="bottom" :show-mask="false">
            <iframe width="100%" height="100%" scrolling="no" style="border: none;"></iframe>
            <div style="position: fixed;bottom:0;width:100%;">
                <x-button @click.native="iframe = false" type="warn"> 关闭 </x-button>
            </div>
        </popup>
    </div>
</template>
<script>
import {
    cookie,
    Popup,
    Cell,
    Card,
    Icon,
    Confirm,
    Loading,
    CellFormPreview,
    Group,
    PopupPicker,
    Msg,
    Box,
    XButton,
    XInput,
} from 'vux'
import axios from 'axios'
import {
    mapGetters,
    mapActions
} from 'vuex'

export default {
    name: 'cash',
    data() {
        return {
            addressData : [],
            id: '',
            shop:{
                id:'',
                name:''
            },
            shops:[],
            status_205_data: {
                msg: '',
                show: false,
                wait: 0,
            },
            post_data: {
                value:["440000","440100"],
                channel_name:'',
                can_select_shop:'',
                channel_id:'',
                shop_id:'',
                card_id: '',
                card_id_1: '',
                trade_type: 0,
                money: '',
                expire_time: '',
                safe_code: '',
                pay_password: '',
                fee: 0,
                money: null,
                arrival_money: ''
            },
            is_valicode: false,
            trade_type: '',
            step: 0,
            iframe: false,
            popup_data: {
                card_select: [],
                card_select_1: [],
                coupon: []
            },
            pay_password: '',
            is_fee: false,
            arrival_money_readonly: true,
            is_popup: false,
            show_password: false,
            is_loading: false,
            confirm_data: {
                title: '说明',
                model: false,
                text: '',
                img: ''
            },
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
        Popup,
        Cell,
        Card,
        Confirm,
        Icon,
        Loading,
        CellFormPreview,
        Group,
        PopupPicker,
        Msg,
        Box,
        XButton,
        XInput
    },
    computed: {
        ...mapGetters(['bank_list', 'cards', 'config', 'coupons', 'user', 'btn_loading']),
        coupon_list() { //红包列表  coupon_list格式[{name:'',value:''}]
            let arr = [{
                name: '请选择',
                value: ''
            }];
            for (let i in this.coupons) {
                arr.push({
                    name: this.coupons[i].name,
                    value: this.coupons[i].id
                });
            }
            return arr;
        },
        coupon_status() {
            if (this.coupon_list.length > 1) {
                return `${this.coupon_list.length-1}张`;
            } else {
                return '无可用券';
            }
        },
        card_number() {
            let number = '';
            if (this.card && this.card.number) {
                number += this.card.number.substr(-4);
            }
            return number;
        },
        collect_config() {
            let config = {};
            if(this.config.collect&&this.$route.query.count_fee||this.$route.query.rate_fee){
                config.count_fee = this.config.collect.count_fee*1 + (this.$route.query.count_fee*1||0);
                config.rate_fee = this.config.collect.rate_fee*1 + (this.$route.query.rate_fee*1||0);
            }else{
                config = this.config.collect || {}
            }
            return config;
        },
        cash_config() {
            return this.config.cash || {};
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
                    _card_list.push({
                        'name': _card.name,
                        'value': _card.id
                    });
                }
            }
            _card_list.push({
                'name': '+添加信用卡',
                'value': '0'
            })
            return [_card_list] || [];
        },
        card_list_1() {
            var _card_list = [];
            for (let _card_id in this.cards) {
                let _card = this.cards[_card_id];
                if (this.post_data.card_id != _card.id || this.trade_type != 'card') { //提现卡
                    if (this.trade_type == 'card' && !this.post_data.card_id_1 && _card.status == 0) { //收款默认选择到账银行卡
                        this.post_data.card_id_1 = _card.id;
                        this.popup_data.card_select_1 = [this.user.card_id];
                    } else {
                        if (this.$route.query.card_id_1 && this.popup_data.card_select_1.length == 0) {
                            this.popup_data.card_select_1 = [this.$route.query.card_id_1];
                        } else if (!this.$route.query.card_id_1 && this.popup_data.card_select_1.length == 0) {
                            this.popup_data.card_select_1 = [this.user.card_id];
                        }
                    }
                    _card_list.push({
                        'name': _card.name,
                        'value': _card.id
                    });
                }
            }
            _card_list.push({
                'name': '+添加银行卡',
                'value': '0'
            })
            return [_card_list];
        },
        card() {
            let _card = null;
            try {
                _card = this.cards[this.post_data.card_id];
                if (_card.status != 0) {
                    this.$vux.toast.show({
                        text: '该卡片正在还款中,不能进行其它交易',
                        type: 'text',
                        time: 3000
                    });
                    this.post_data.card_id = '';
                    this.popup_data.card_select = [];
                    _card = null;
                }
            } catch (e) {}
            return _card;
        },
        cashName() {
            let name = this.$route.path.indexOf('/cash/money') != -1 ? '提现' : '收款';
            return '请输入' + name + '金额';
        },
        card_name: function() {
            let card_num = '';
            let last_num = '请选择';
            if (this.card && this.card.number) {
                card_num = this.card.number;
            }
            try {
                if (card_num) {
                    card_num = card_num.replace(/\s+/g, '');
                    last_num = '尾号' + card_num.substr(-4);
                }
            } catch (e) {}
            return last_num;
        },
        fee_list() {
            let arr = [];
            if (this.trade_type == 'card') {
                arr.push({
                    label: `服务费 = 收款金额 x ${(this.collect_config.rate_fee*100).toFixed(2)}% + ${(this.collect_config.count_fee*1).toFixed(2)}/笔`
                })
            } else {
                arr.push({
                    label: `服务费 = 提现金额 x ${(this.cash_config.rate_fee*100).toFixed(2)}% + ${(this.cash_config.count_fee*1).toFixed(2)}/笔`
                })
            }
            return arr
        }
    },
    created() {
        if(this.$route.query.channel_id){
            this.post_data = this.$db.get("post_data");
        }
        this.loadUser();
        this.trade_type = this.$route.params.trade_type;
        this.post_data.channel_id = this.$route.query.channel_id||'';
        if(this.post_data.channel_id){ this.post_data = this.$db.get("post_data")};
         this.post_data.channel_id = this.$route.query.channel_id;
        this.post_data.channel_name = this.$route.query.channel_name||'';
        this.post_data.can_select_shop = this.$route.query.can_select_shop||'';
        this.post_data.shop_id = this.$route.query.shop_id ||'';
        this.post_data.shop_name = this.$route.query.shop_name ||'';
        let self = this;
        if (this.trade_type == 'card') {
            this.$store.commit('updatePageTitle', '收款');
            this.post_data.trade_type = 0;
            if (this.$isNull(this.card_list) || this.card_list[0].length <= 1 || !this.post_data.card_id) {
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
                        self.$db.set('path', {
                            path: '/cash/card',
                            data: {
                                status: 0,
                                msg: '添加银行卡收款'
                            }
                        })
                        self.$router.replace('/card/add?step=0');
                    }
                })
                return;
            }
        } else {
            this.$store.commit('updatePageTitle', '余额提现');
            this.post_data.trade_type = 3;
        }


        if (this.$isNull(this.card_list_1) || this.card_list_1[0].length <= 1) {
            self.$vux.confirm.show({
                title: '添加卡片',
                content: '暂无可用的到账银行卡，请立即添加',
                confirm_text: '前往',
                onCancel() {

                },
                onConfirm() {
                    self.$db.set('path', {
                        path: '/cash/card',
                        data: {
                            status: 0,
                            msg: '添加银行卡收款'
                        }
                    })
                    self.$router.replace('/card/add?step=0');
                }
            })
            return;
        }
        this.loadCards(); //获取最新卡片

        if (this.trade_type == 'card') {
            var card_id = this.$route.query.card_id;
            if (card_id) {
                this.popup_data.card_select = [card_id];
            }
        }
        this.loadConfig();
        this.loadCoupons({
            status: 1
        });
    },
    methods: {
        ...mapActions(['loadUser', 'loadCoupons', 'loadCards', 'loadConfig']),
        feeType(value, name) {
            if (!value) {
                return '';
            }
            return name;
        },
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
        changeMoney() {
            this.updateFee();
        },
        updateFee: function(update_type) {
            let fee = 0;
            if (update_type == 1) {
                if (!this.post_data.arrival_money) {
                    return;
                }
                let arrival_money = Math.abs(this.post_data.arrival_money);
                if (this.trade_type == 'card') {
                    fee = this.collect_config.count_fee * 1 + arrival_money * 1 / (1 - this.collect_config.rate_fee);
                } else {
                    fee = this.cash_config.count_fee * 1 + arrival_money * 1 / (1 - this.cash_config.rate_fee);
                }
                this.post_data.fee = (Math.ceil(fee * 100) / 100).toFixed(2);
                this.post_data.money = (Math.floor((arrival_money * 1 + this.post_data.fee * 1) * 100) / 100).toFixed(2);
            } else {
                if (!this.post_data.money) {
                    return;
                }
                let money = Math.abs(this.post_data.money);
                if (this.trade_type == 'card') {
                    fee = this.collect_config.count_fee * 1 + money * this.collect_config.rate_fee;
                } else {
                    fee = this.cash_config.count_fee * 1 + money * this.cash_config.rate_fee;
                }
                this.post_data.fee = (Math.ceil(fee * 100) / 100).toFixed(2);
                this.post_data.arrival_money = (Math.floor((money * 1 - this.post_data.fee * 1) * 100) / 100).toFixed(2);
            }
            // if(this.post_data.coupon){  //有用优惠券
            //   let amount = 0;
            //   for (let i in this.coupons) {
            //     if (this.coupons[i].id == this.task.coupon) {
            //       amount = this.coupons[i].amount * 1;
            //     }
            //   }
            //   if(this.post_data.total_money>amount){
            //     this.post_data.discount_fee = (Math.ceil(this.post_data.total_fee * amount / this.post_data.total_money * 100) / 100).toFixed(2);  
            //   }else{
            //     this.post_data.discount_fee = this.post_data.total_fee;
            //   }
            //   this.fee_list.push({ label: "红包减免", value: this.task.discount_fee * -1 });
            // }
        },
        loadCard(card_id) {
            if (!this.$isNull(this.cards)) {
                this.card = this.cards[card_id];
            }
            if (this.$isNull(this.card)) {
                this.$store.commit('updateBtnLoading', true);
            }
            this.$axios.get('/api/cards/' + card_id).then((res) => {
                this.$store.commit('updateBtnLoading', false);
                this.card = res.data;
                this.$store.commit('addCard', this.card);
            })
        },
        doTrade() {
            if (!this.post_data.card_id) {
                this.$vux.toast.show({
                    text: '请选择银行卡',
                    type: 'text',
                    time: 3000
                });
                return;
            }
            if (this.is_loading) {
                return;
            }
            this.is_valicode=false;
            this.is_loading = true;
            this.$store.commit('updateBtnLoading', true);
            let self = this;
            this.$axios.post('/api/trades', this.post_data).then((res) => {
                this.$store.commit('updateBtnLoading', false);
                this.is_loading = false;
                if (res.status == 200) {
                    this.id = res.data.id;
                    this.msg_data.title = (this.post_data.trade_type == '0' ? '收款' : '提现') + '申请已提交,请留意银行短信';
                    this.user.money = res.money;
                    this.$store.commit('updateUser', this.user);
                    this.msg_data.buttons[0].link = '/trade/' + this.id;
                    this.msg_data.description = '提现到账时间约1-5分钟';
                    if (!this.user.safe_pay) {
                        this.msg_data.buttons[1].text = '设置支付密码';
                        this.msg_data.buttons[1].link = '/password/pay';
                    }
                    this.step = 1;
                } else if (res.status == 202) {
                    self.$vux.toast.show({
                        text: res.data.msg,
                        type: 'text',
                        time: 3000
                    });
                    self.is_valicode = true;
                    self.post_data.sms_id = res.data.sms_id;
                } else if (res.status == 206) {
                    if (res.data) {
                        self.$vux.confirm.show({
                            title: '安全验证',
                            content: '需要验证执卡人信息',
                            onConfirm() {
                                document.write(res.data);
                                /*
                                if(navigator.userAgent.toLowerCase().indexOf('micromessenger') != -1){  //判断是否微信浏览器打开
                                  document.write(res.data);
                                }else{
                                  document.querySelector('iframe').setAttribute('srcdoc',res.data);
                                  self.iframe = true;
                                }*/
                            }
                        })
                    }
                } else if (res.status == 207) {
                    if (res.headers['x-redirect']) {
                        self.$vux.confirm.show({
                            title: '安全验证',
                            content: res.data,
                            onConfirm() {
                                if (navigator.userAgent.toLowerCase().indexOf('micromessenger') != -1) { //判断是否微信浏览器打开
                                    location.href = res.headers['x-redirect'];
                                } else {
                                    document.querySelector('iframe').setAttribute('src', res.headers['x-redirect']);
                                    self.iframe = true;
                                }
                            }
                        })
                    }
                } else if (res.status == 208) { //添加结算卡
                    self.$vux.confirm.show({
                        title: res.data,
                        content: '立即前往设置！',
                        onConfirm() {
                            self.$router.push('/card?card_type=1')
                        }
                    })
                } else if (res.status == 205) { //
                    this.status_205_data.show = true;
                    this.status_205_data.msg = res.data.msg;
                    this.status_205_data.wait = res.data.wait;
                    setTimeout(() => {
                        self.status_205_data.show = false;
                        self.doTrade();
                    }, self.status_205_data.wait * 1000);
                }
            }).catch((e) => {
                this.is_loading = false;
            })
            //dizhi 
            var isChooseAddr=document.querySelector(".vux-popup-picker-value"); 
            if(post_data.channel_name&&isChooseAddr==null){this.$vux.toast.show({
                    text: '请选择所需的地址',
                    type: 'text',
                    time: 3000
                });}         
        },
        onShow(names){
            console.log(353636)
        },
        onShadowChange(ids,names) { 
            
            this.post_data.value = names;
        },
        update_post_data(){        
            this.$db.set( "post_data", this.post_data )    
        },
     

    },
    mounted() {
        setTimeout(function() {
            document.querySelector('.weui-input').focus();
            document.querySelector('.weui-input').focus();
        }, 1000);
    },
    watch: {
        post_data:{
            handler(newName, oldName) {
             this.update_post_data();
            },
            deep: true
        },
        "popup_data.card_select" (cur, old) {
            if (cur[0] == '0') {
                this.$db.set('path', {
                    path: '/cash/card',
                    data: {
                        status: 0,
                        msg: '添加信用卡'
                    }
                })
                this.$router.replace('/card/add?step=0');
                return;
            }
            this.post_data.card_id = cur[0];
            // this.loadCard(this.post_data.card_id);
            this.updateFee();
        },
        "popup_data.card_select_1" (cur, old) {
            if (cur[0] == '0') {
                this.$db.set('path', {
                    path: '/cash/card',
                    data: {
                        status: 0,
                        msg: '添加银行卡'
                    }
                })
                this.$router.replace('/card/add?step=0');
                return;
            }
            if (this.trade_type == 'card') { //收款
                this.post_data.card_id_1 = cur[0];
            } else { //提现
                this.post_data.card_id = cur[0];
            }
            this.updateFee();
        },
        "popup_data.coupon" (cur, old) {
            this.post_data.coupon = cur[0];
            this.updateFee();
        },
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
