<template>
    <div class="card-edit">
        <group gutter="0">
            <cell :title="card.bank_name" :value="card.card_type==0?'信用卡':'储蓄卡'">
                <i slot="icon" v-if="card" :class="['bank-icon','icon-' + card.bank_key]" :style="'color:'+card.color"></i>
                <div slot="inline-desc">{{is_number}}</div>
            </cell>
        </group>
        <group v-if="post_data.card_type==0" title="">
            <!-- <x-input text-align="right" type="number" title="卡号" placeholder="请输入卡号" required v-model="post_data.number"></x-input> -->
            <popup-picker title="账单日" :data="days" :display-format="dayFormat" v-model="post_data.bill_day" placeholder="请选择账单日" :show-name="true" popup-title="请选择每月账单日"></popup-picker>
            <popup-picker title="还款日" :data="days" :display-format="dayFormat" v-model="post_data.repay_day" placeholder="请选择还款日" :show-name="true" popup-title="请选择每月还款日"></popup-picker>
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
        </group>
        <group v-if="post_data.card_type==1" title="开户行信息">
            <x-input text-align="right" type="number" title="卡号" placeholder="请输入卡号" required v-model="post_data.number"></x-input>
            <x-address title="开户地区" v-model="post_data.address" :raw-value="true" placeholder="请选择开户地区" :list="addressData" value-text-align="right"></x-address>
            <x-input text-align="right" class="x-input" title="支行名称" v-model="post_data.branch_name" placeholder="输入关键词" :show-clear="false">
                <label slot="right" class="zhihang" @click="searchBanks(true)" style="margin-right:-18px">&nbsp;&nbsp;&nbsp;&nbsp;</label>
            </x-input>
            <popup-picker title="支行名称" v-model="bank_select" style="display:none" :show="is_popup" @on-hide="is_popup=false" :display-format="bankFormat" :data="bank_list_data" placeholder="请选择开户支行" popup-title="请选择开户支行"></popup-picker>
        </group>
        <group title="持卡人信息">
            <x-switch text-align="right" title="绑定为结算卡" v-if="post_data.card_type == 1" :value-map="[0, 1]" v-model="post_data.is_default"></x-switch>
            <x-input text-align="right" type="text" is-type="china-name" title="姓名" placeholder="请输入持卡人姓名" v-model="post_data.realname"></x-input>
            <x-input text-align="right" type="text" :max="18" title="身份证号" placeholder="请输入持卡人身份证号码" v-model="post_data.idcard"></x-input>
            <x-input text-align="right" type="text" title="手机号" placeholder="银行预留手机号" v-model="post_data.mobile"></x-input>
        </group>
        <confirm v-model="confirm_data.model" :title="confirm_data.title" :show-cancel-button="false">
            <img width="200px" height="115px" v-if="confirm_data.img" :src="confirm_data.img">
            <p>{{confirm_data.text}}</p>
        </confirm>
        <box gap="10px 10px">
            <x-button :show-loading="btn_loading" type="primary" @click.native="cardSave">保存</x-button>
        </box>
    </div>
</template>
<script>
import {
    cookie,
    Group,
    Confirm,
    Icon,
    XSwitch,
    Box,
    Card,
    XInput,
    ChinaAddressV4Data,
    Cell,
    XButton,
    Msg,
    XAddress,
    PopupPicker,
    Value2nameFilter as value2name
} from 'vux'
import {
    mapGetters,
    mapActions
} from 'vuex'
export default {
    name: 'login',
    components: {
        Group,
        Card,
        Icon,
        Box,
        Confirm,
        XSwitch,
        XInput,
        Cell,
        XButton,
        Msg,
        XAddress,
        PopupPicker
    },
    data() {
        return {
            is_popup: false,
            has_user_info: false,
            addressData: ChinaAddressV4Data,
            bank_list_data: [],
            bank_select: [],
            post_data: {
                id: '',
                card_type: '',
                bill_day: [],
                repay_day: [],
                safe_code: '',
                is_default: 1,
                branch_name: '',
                number: '',
                mobile: '',
                idcard: '',
                realname: '',
                branch_id: ''
            },
            confirm_data: {
                title: '说明',
                model: false,
                text: '',
                img: ''
            }
        }
    },
    created() {
        this.$store.commit('updatePageTitle', '编辑');
        this.post_data.id = this.$route.query.id;
        this.loadCard(this.post_data.id);
        if (this.$store.getters && this.$store.getters.address) {
            this.post_data.address = this.$store.getters.address;
        }
        if (!this.$isNull(this.user) && this.user.id_card) {
            this.post_data.mobile = this.user.mobile || '';
            this.post_data.realname = this.user.realname || '';
            this.post_data.idcard = this.user.id_card || '';
            if (this.user.address && this.user.address.length >= 3) {
                var address_arr = this.user.address.split(',');
                if (address_arr.length >= 3) {
                    this.address = [address_arr[0], address_arr[1], address_arr[2]];
                }
            }
            this.has_user_info = true;
        } else {
            this.has_user_info = false;
        }
    },
    computed: {
        ...mapGetters(['cards', 'user', 'btn_loading', 'bank_list']),
        card() {
            let _card = {};
            if (!this.$isNull(this.cards) && this.post_data.id) {
                _card = this.cards[this.post_data.id];
            }
            if (!this.$isNull(_card)) {
                this.post_data.mobile = _card.mobile;
                this.post_data.card_type = _card.card_type;
                if (!this.post_data.bill_day[0]) {
                    this.post_data.bill_day[0] = _card.bill_day;
                }
                if (!this.post_data.repay_day[0]) {
                    this.post_data.repay_day[0] = _card.repay_day;
                }
                this.post_data.safe_code = _card.safe_code;
                this.post_data.expire_time = _card.expire_time;
                this.post_data.number = _card.number;
                this.post_data.name = _card.name;
                this.post_data.bank_name = _card.bank_name;
                this.post_data.color = _card.color;
            }
            return _card;
        },
        is_number() {
            let _card = this.card.number;
            let name = '尾号 ';
            try {
                name += _card.substr(-4);
            } catch (e) {}
            return name;
        },
        days: function() {
            var _days = [];
            for (var i = 1; i <= 31; i++) {
                var t_name = String(i);
                if (t_name.length == 1) {
                    t_name = '0' + t_name;
                }
                t_name = '每月' + t_name + '日';
                _days.push({
                    name: t_name,
                    value: i
                })
            }
            return [_days];
        },
    },
    methods: {
        ...mapActions(['loadCard']),
        bankFormat(value, name) {
            this.post_data.branch_name = name;
            if (value.length > 0) {
                this.post_data.branch_id = value[0];
            }
            return name;
        },
        searchBanks(value) {
            var address_list = value2name(this.post_data.address, ChinaAddressV4Data).split(' ');
            var data = {
                bank_name: this.post_data.bank_name,
                address: address_list,
                keyword: this.post_data.branch_name,
                bank_card: this.post_data.number
            };
            this.$axios.post('/api/card/banks', data).then((res) => {
                if (res.data.length == 0 && value) {
                    this.post_data.branch_name = '';
                    this.searchBanks(false);
                    return
                }
                this.bank_list_data = [res.data];
                setTimeout(() => {
                    this.is_popup = true;
                }, 100);
            })
        },
        dayFormat(value, name) {
            if (!value) {
                return '';
            }
            return '每月' + value[0] + '日';
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
                this.confirm_data.img = "";
                this.confirm_data.title = '服务费说明';
                this.confirm_data.text = '还款金额*费率+拆分次数';
            }
        },
        cardSave() {
            this.$store.commit('updateBtnLoading', true);
            this.$axios.post('/api/cards/', this.post_data).then((res) => {
                this.$store.commit('updateBtnLoading', false);
                this.loadCard(res.data.id);
                this.$vux.toast.show({
                    text: "修改成功",
                    type: "seccess",
                    time: 3000
                })
                this.$router.replace('/card');
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

.trade-type-1 {
    color: green;
}

.trade-type-0 {
    color: red;
}

.zhihang:after {
    content: " ";
    display: inline-block;
    height: 6px;
    width: 6px;
    border-width: 2px 2px 0 0;
    border-color: #C8C8CD;
    border-style: solid;
    -webkit-transform: matrix(0.71, 0.71, -0.71, 0.71, 0, 0);
    transform: matrix(0.71, 0.71, -0.71, 0.71, 0, 0);
    position: relative;
    top: -2px;
    position: absolute;
    top: 50%;
    margin-top: -4px;
}

.card-edit .x-input {
    margin-right: 11px;
}
</style>
