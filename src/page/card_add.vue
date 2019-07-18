
<template>
    <div class="card-add">
        <div v-if="step==0">
            <label class="btnScan" @click="firstCaption">
                <!-- <input type="file" multiple="multiple" @change="findCard" class="btnFind" capture="camera" accept="image/*" />
        <i class="icon icon-xiangji"></i> -->
            </label>
            <group style="margin-top: 3em;">
                <x-input text-align="right" type="text" class="bigNumber" :mask="maskNumber" :max="24" title="卡号" placeholder="请输入卡号" :autofocus="true" v-model="post_data.number">
                </x-input>
            </group>
            <box gap="10px 10px">
                <x-button type="primary" :show-loading="btn_loading" @click.native="nextStep">下一步</x-button>
            </box>
        </div>

    <div v-if="step==1||step==2">
      <group gutter="0">
        <cell :title="card_info.name" :value="post_data.bank_name" :inline-desc="post_data.number">
          <i slot="icon" :style="'color:'+post_data.color" :class="['bank-icon','icon-' + post_data.bank_key]"></i>
        </cell>
      </group>
      <group v-if="post_data.card_type==0" title="">
        <popup-picker title="账单日" :data="days" :display-format="dayFormat" v-model="post_data.bill_day" placeholder="请选择账单日" :show-name="true" popup-title="请选择每月账单日"></popup-picker>
        <popup-picker title="还款日" :data="days" :display-format="dayFormat" v-model="post_data.repay_day" placeholder="请选择还款日" :show-name="true" popup-title="请选择每月还款日"></popup-picker>
        <x-input text-align="right" type="number" :max="4" title="有效期" placeholder="示例:04/25,输入0425" :show-clear="false" v-model="post_data.expire_time">
          <div slot="right" @click="confirmMsg('expire_time')">
            <icon slot="right" type="info-circle"></icon>
          </div>
        </x-input>
        <x-input text-align="right" type="number" :max="3" title="校验码" placeholder="卡背面末3位" :show-clear="false" v-model="post_data.safe_code">
          <div slot="right" @click="confirmMsg('safe_code')">
            <icon type="info-circle"></icon>
          </div>
        </x-input>
      </group>
      <group v-if="post_data.card_type==1" title="开户行信息">
        <x-switch text-align="right" title="设置为结算卡" v-if="user.card_id" :value-map="['0', '1']" v-model="post_data.is_default"></x-switch>
        <x-address title="开户地区" v-model="post_data.address" :raw-value="true" placeholder="请选择开户地区" :list="addressData" value-text-align="right"></x-address>
        <!-- <x-input text-align="right" class="x-input" title="选择支行" v-model="post_data.branch_name" placeholder="输入关键词" :show-clear="false">
          <label slot="right" class="zhihang"  @click="searchBanks(true)" style="margin-right:-18px">&nbsp;&nbsp;&nbsp;&nbsp;</label>
        </x-input>
        <popup-picker title="支行名称" v-model="bank_select" style="display:none" :show="is_popup" @on-hide="is_popup=false" :display-format="bankFormat" :data="bank_list" placeholder="请选择开户支行" popup-title="请选择开户支行"></popup-picker> -->
      </group>
      <group v-if="has_user_info" title="持卡人信息">
        <cell title="姓名" :value="post_data.realname"></cell>
        <x-input text-align="right" type="text" :max="11" title="手机号" placeholder="银行预留手机号" v-model="post_data.mobile"></x-input>
      </group>
      <group v-if="!has_user_info" title="持卡人信息">
        <x-input text-align="right" type="text" is-type="china-name" title="姓名" placeholder="请输入持卡人姓名" v-model="post_data.realname"></x-input>
        <x-input text-align="right" type="text" :min="18" :max="18" :is-type="isIdCard" title="身份证号" placeholder="请输入持卡人身份证号码" v-model="post_data.idcard"></x-input>
        <x-input text-align="right" type="number" is-type="china-mobile" title="手机号" placeholder="银行预留手机号" v-model="post_data.mobile"></x-input>
      </group>
      <box gap="10px 10px">
        <x-button :show-loading="btn_loading" type="primary" @click.native="nextStep">下一步</x-button>
      </box>
    </div>
    <confirm v-if="step==2" v-model="is_show" :close-on-confirm="false" title="验证码" @on-cancel="step=1;is_show=false;" @on-confirm="nextStep()">
      <div>
        <group>
          <x-input :max="4" placeholder="请输入短信验证码" :show-clear="false" v-model="post_data.valicode">
            <x-button :show-loading="btn_loading" slot="right" @click.native="sendSMS" class="weui-vcode-btn">{{sendName}}</x-button>
          </x-input>
        </group>
      </div>
    </confirm>
    <confirm v-model="confirm_data.model" :title="confirm_data.title" :show-cancel-button="false">
      <img width="200px" height="115px" :src="confirm_data.img">
      <p>{{confirm_data.value}}</p>
    </confirm>
    <msg v-if="step==3" :title="msg_data.title" :description="msg_data.description" :buttons="msg_data.buttons" icon="success"></msg>
  </div>
</template>
<script>
import {
    cookie,
    Cell,
    Confirm,
    Group,
    Icon,
    XSwitch,
    PopupPicker,
    XAddress,
    ChinaAddressV4Data,
    Msg,
    Box,
    XButton,
    XInput,
    Value2nameFilter as value2name
} from 'vux'
import {
    mapGetters,
    mapActions
} from 'vuex'

export default {
    name: 'card',
    data() {
        return {
            // img:'',
            // is_img:false,
            step: 0,
            id: '',
            img: '',
            maskNumber: '9999 9999 9999 9999 9999',
            card_type: 0,
            bank_name: '',
            bank_key: '',
            bill_day: [],
            repay_day: [],
            card_info: {},
            post_data: {
                number: '',
                color: '',
                name: '',
                card_type: 0,
                bank_name: '',
                bank_key: '',
                bill_day: [],
                repay_day: [],
                realname: '',
                idcard: '',
                mobile: '',
                address: [],
                is_default: '1',
                expire_time: '',
                safe_code: '',
                valicode: '',
                branch_name: ''
            },
            confirm_data: {
                title: '说明',
                model: false,
                text: '',
                img: ''
            },
            realname: '',
            idcard: '',
            mobile: '',
            is_default: '',
            safe_code: '',
            expire_time: '',
            has_user_info: false,
            valicode: '',
            timer: 0,
            addressData: ChinaAddressV4Data,
            branch_name: '',
            bank_list: [],
            is_show: true,
            bank_select: [],
            weixin_user: {},
            is_popup: false,
            _timer: null,
            img_data: null,
            msg_data: {
                title: '',
                description: '',
                buttons: [{
                    type: 'primary',
                    text: '创建还款计划',
                    link: '/task/add?card_id=' + this.id
                }, {
                    type: 'default',
                    text: '添加新卡片',
                    onClick: this.initCard
                }, {
                    type: 'default',
                    text: '返回卡包',
                    link: '/card'
                }]
            }
        }
    },
    components: {
        Cell,
        Group,
        Confirm,
        PopupPicker,
        XSwitch,
        Icon,
        XAddress,
        Msg,
        Box,
        XButton,
        XInput
    },
    computed: {
        ...mapGetters(['user', 'cards', 'address', 'btn_loading']),
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
        sendName: function() {
            if (this.timer <= 0) {
                return '获取验证码';
            }
            return this.timer + '秒';
        },
        isWeixin() {
            return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
        },
    },
    created() {
        this.$store.commit('updatePageTitle', '新增银行卡');
        this.step = this.$route.query.step || 0;
        if (this.address) {
            this.post_data.address = this.address;
        }
        if (this.isWeixin) {
            this.weixin_user = this.$db.get('weixin_user') || {};
        }
        if (!this.$isNull(this.user) && this.user.id_card) {
            this.post_data.idcard = this.user.id_card;
            this.post_data.mobile = this.user.mobile;
            this.post_data.realname = this.user.realname;
            if (this.user.address && this.user.address.length >= 3) {
                var address_arr = this.user.address.split(',');
                if (address_arr.length >= 3) {
                    this.post_data.address = [address_arr[0], address_arr[1], address_arr[2]];
                }
            }
            this.has_user_info = true;
        } else {
            this.has_user_info = false;
        }
    },
    mounted() {
        setTimeout(function() {
            document.querySelector('.weui-input').focus();
            document.querySelector('.weui-input').focus();
        }, 1000);
    },
    watch: {
        "$route" (cur, old) {
            this.step = cur.query.step;
        },
    },
    methods: {
        ...mapActions(['loadUser']),
        firstCaption() {
            let first_caption = !this.$db.get('first_caption');
            if (first_caption) {
                alert('小提示:请横向取景让卡片充满画面,来提升识别率');
                this.$db.set('first_caption', 1)
            }
        },
        findCard($event) {
            let self = this;
            self.$store.commit('updateBtnLoading', true);
            var MAX_HEIGHT = 400;
            let files = $event.target.files;
            for (let i = 0; i < files.length; i++) {
                let reader = new FileReader();
                reader.readAsDataURL(files[i]);
                reader.onload = function(e) {
                    var canvas = document.createElement('canvas');
                    var ctx = canvas.getContext('2d');
                    var img = new Image();
                    img.onload = function() {
                        var img_url = null;
                        let rate = 320 / img.width;
                        img.width = img.width * rate;
                        img.height = img.height * rate;
                        canvas.width = img.width;
                        canvas.height = img.height;
                        ctx.drawImage(img, 0, 0, img.width, img.height);
                        let post_data = {
                            image: canvas.toDataURL('image/png', 1)
                        };
                        self.$axios.post('/api/card/find', post_data).then((res) => {
                            self.$store.commit('updateBtnLoading', false);
                            self.post_data.number = res.data.number;
                        })
                    };
                    img.src = e.target.result;
                }
            }

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
        dayFormat(value, name) {
            if (!value) {
                return '';
            }
            return '每月' + value[0] + '日';
        },
        nextStep() {
            if (this.step == 0) {
                if (!this.post_data.number) {
                    this.$vux.toast.show({
                        text: '请输入卡号',
                        type: 'text',
                        time: 3000
                    });
                    return;
                }
                this.$store.commit('updateBtnLoading', true);
                this.$axios.get('/api/card/check/' + this.post_data.number.replace(/\s+/g, "")).then((res) => {
                    this.$store.commit('updateBtnLoading', false);
                    this.card_info = res.data;
                    this.$store.commit('addBankList', res.data);
                    let _name;
                    try {
                        _name = res.data.bank_name + '(' + this.post_data.number.replace(/\s+/g, "").substr(this.post_data.number.replace(/\s+/g, "").length - 4) + ')';
                    } catch (e) {}
                    this.post_data.bank_key = res.data.bank_key.toUpperCase();
                    this.post_data.card_type = res.data.card_type;
                    this.post_data.bank_name = res.data.bank_name;
                    this.post_data.name = _name;
                    //this.post_data.branch_name = res.data.bank_name;
                    this.post_data.color = res.data.color;
                    this.$router.push('/card/add?step=1')
                    this.step = 1;
                })
            } else if (this.step == 1 || this.step == 2) {
                var data = {
                    number: this.post_data.number,
                    name: this.post_data.name,
                    is_default: this.post_data.is_default,
                    bank_name: this.post_data.bank_name,
                    bank_key: this.post_data.bank_key,
                    card_type: this.post_data.card_type,
                    realname: this.post_data.realname,
                    mobile: this.post_data.mobile,
                    idcard: this.post_data.idcard,
                    valicode: this.post_data.valicode
                };
                if (this.post_data.card_type == 1) {
                    data['branch_name'] = this.post_data.branch_name;
                    // if (this.post_data.branch_name) {
                    //     if (!this.bank_select[0]) {
                    //         return this.searchBanks(true);
                    //     }
                    // } else {
                    //     return this.$vux.toast.show({
                    //         text: '请输入支行名称关键词并查询选择',
                    //         type: 'text',
                    //         time: 3000
                    //     });
                    // }
                    // data['branch_id'] = this.bank_select[0];
                } else {
                    data['branch_name'] = this.post_data.bank_name;
                    data['bill_day'] = this.post_data.bill_day[0];
                    data['repay_day'] = this.post_data.repay_day[0];
                    data['expire_time'] = this.post_data.expire_time;
                    data['safe_code'] = this.post_data.safe_code;
                }
                if (this.isWeixin && this.weixin_user) {
                    data['weixin_open_id'] = this.weixin_user.openid
                }
                this.$store.commit('updateBtnLoading', true);
                this.$axios.post('/api/card/add', data).then((res) => {
                    this.$store.commit('updateBtnLoading', false);
                    if (res.headers['x-token']) {
                        this.$store.commit('setToken', res.headers['x-token'], {
                            expires: 30
                        });
                        this.loadUser();
                    }
                    this.$store.commit('updateAddress', value2name(this.post_data.address, ChinaAddressV4Data).split(' '));
                    if (res.status == 202) {
                        this.post_data.valicode = '';
                        this.$vux.toast.show({
                            text: res.data,
                            type: 'text',
                            time: 3000
                        });
                        this.step = 2;
                        this.is_show = true;
                        this.initTimer();
                    } else if (res.status == 203) {
                        this.post_data.valicode = '';
                        this.$vux.toast.show({
                            text: res.data,
                            type: 'text',
                            time: 3000
                        });
                    } else if (res.status == 200) {
                        this.step = 3;
                        this.msg_data.title = '添加成功';
                        this.id = res.data.id;
                        this.$store.commit('addCard', res.data);
                        this.msg_data.description = " ";
                        this.$store.commit('updatePageTitle', '添加成功');
                        this.$vux.toast.show({
                            text: '添加成功',
                            time: 3000
                        });
                        if (res.data.token) {
                            this.$store.commit('setToken', res.data.token, {
                                expires: 30
                            });
                            cookie.set('token', res.data.token);
                        }
                        if (!this.$isNull(this.$db.get('path')) && this.$db.get('path').path) {
                            let _card_id = `?card_id=${res.data.id}`;
                            if (this.$db.get('path').path.indexOf('/cash/money') != -1) {
                                _card_id = `?card_id=${res.data.id}`;
                            } else if (this.$db.get('path').path.indexOf('/cash/card') != -1) {
                                if (res.data.card_type == 0) {
                                    _card_id = `?card_id=${res.data.id}`;
                                } else {
                                    _card_id = `?card_id_1=${res.data.id}`;
                                }
                            } else if (this.$db.get('path').path.indexOf('/task/add') != -1) {
                                _card_id = `?card_id=${res.data.id}`;
                            }
                            this.$router.replace(this.$db.get('path').path + _card_id);
                            this.$db.set('path', '');
                            return;
                        }
                        if (this.post_data.card_type == 0) {
                            this.msg_data.buttons[0].link = '/task/add?card_id=' + this.id;
                        } else {
                            this.msg_data.buttons[0].link = '/card?card_type=' + this.post_data.card_type;
                            this.msg_data.buttons[0].text = '返回卡包';
                            this.msg_data.buttons.pop();
                        }
                    }
                })
            }
        },
        sendSMS() {
            if (this.timer > 0) {
                return;
            }
            var post_data = {
                mobile: this.post_data.mobile
            };
            try {
                var token = post_data.mobile;
                post_data.timestamp = parseInt(new Date().getTime() / 1000) + '';
                var key = post_data.timestamp;
                for (var i = 0; i < key.length; i++) {
                    if (token.length <= i) {
                        break;
                    }
                    post_data.token += String.fromCharCode(48 + (token.charCodeAt(i) + key.charCodeAt(i)) % 74);
                }
            } catch (e) {}
            this.$axios.post('/api/valicode', post_data).then((res) => {
                this.initTimer();
            })
        },
        initTimer() {
            this.timer = 60;
            this._timer = setInterval(() => {
                this.timer -= 1;
                if (this.timer <= 0) {
                    clearInterval(this._timer)
                }
            }, 1000);
        },
        initCard() {
            this.id = '';
            this.post_data.number = '';
            this.post_data.repay_day = [];
            this.post_data.bill_day = [];
            this.post_data.safe_code = '';
            this.post_data.expire_time = '';
            this.post_data.valicode = '';
            this.post_data.mobile = '';
            this.step = 0;
        },
        searchBanks(value) {
            var address_list = value2name(this.post_data.address, ChinaAddressV4Data).split(' ');
            var post_data = {
                bank_name: this.post_data.bank_name,
                address: address_list,
                keyword: this.post_data.branch_name,
                bank_card: this.post_data.number
            };
            this.$axios.post('/api/card/banks', post_data).then((res) => {
                if (res.data.length == 0 && value) { //获取不到支行是 清空branch_name从新提交一次
                    this.post_data.branch_name = '';
                    this.searchBanks(false);
                    return
                }
                this.bank_list = [res.data];
                setTimeout(() => {
                    this.is_popup = true;
                }, 100);
                this.$store.commit('updateAddress', value2name(this.post_data.address, ChinaAddressV4Data).split(' '));
            })
        },
        bankFormat(value, name) {
            this.post_data.branch_name = name;
            return name;
        },
        isValiDate(val) {
            if (val.replace(/\d/ig, '') != '') {
                return {
                    valid: false,
                    msg: '请输入数字'
                }
            } else {
                var month = val.substr(0, 2);
                var year = val.substr(2);
                var now_year = String((new Date()).getFullYear());
                var now_month = (new Date()).getMonth() + 1;
                if (now_month > 13) {
                    now_month = 1;
                }
                if (now_month < 10) {
                    now_month = '0' + now_month;
                }
                if (parseInt(month) < 1 || parseInt(month) > 12 || parseInt('20' + year + month) < parseInt(now_year + now_month)) {
                    return {
                        valid: false,
                        msg: '有效期错误'
                    }
                }
                return {
                    valid: true
                }
            }
        },
        isNumber(val) {
            if (val.replace(/\d/ig, '') == '') {
                return {
                    valid: true
                }
            } else {
                return {
                    valid: false,
                    msg: '请输入数字'
                }
            }
        },
        isIdCard(code) {
            var city = ["11", "12", "13", "14", "15", "21", "22", "23", "31", "32", "33", "34", "35", "36", "37", "41", "42", "43", "44", "45", "46", "50", "51", "52", "53", "54", "61", "62", "63", "64", "65", "71", "81", "82", "91"];
            var tip = "";
            var pass = true;
            if (code && code.length != 18) {
                return {
                    valid: pass
                }
            };
            if (!/^\d{6}(18|19|20)?\d{2}(0[1-9]|1[012])(0[1-9]|[12]\d|3[01])\d{3}(\d|X)$/i.test(code)) {
                tip = "身份证号格式错误";
                pass = false;
            } else if (city.indexOf(code.substr(0, 2)) == -1) {
                tip = "身份证号格式错误!";
                pass = false;
            } else {
                if (code.length == 18) {
                    code = code.split('');
                    var factor = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
                    var parity = [1, 0, 'X', 9, 8, 7, 6, 5, 4, 3, 2];
                    var sum = 0;
                    var ai = 0;
                    var wi = 0;
                    for (var i = 0; i < 17; i++) {
                        ai = code[i];
                        wi = factor[i];
                        sum += ai * wi;
                    }
                    var last = parity[sum % 11];
                    if (parity[sum % 11] != code[17]) {
                        tip = "身份证号格式错误!!";
                        pass = false;
                    }
                }
            }
            return {
                valid: pass,
                msg: tip
            }

        }
    }
}
</script>
<style lang="less">
.btnFind {
    width: 100%;
    position: absolute;
    z-index: 10;
    font-size: 10em;
    display: inline-block;
    left: 0;
    opacity: 0;
}

.btnScan {
    text-align: center;
    width: 100%;
    display: inline-block;
}

.btnScan .icon {
    border-radius: 10px;
    font-size: 6em;
    background-color: #fff;
    padding: 20px 10px 0 10px;
}

div .fix-bottom {
    padding: 10px;
    position: fixed;
    bottom: 3em;
    width: 100%;
    box-sizing: border-box;
    overflow: hidden;
}

.bigNumber {
    font-size: 5.5vw;
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

.card-add .x-input {
    margin-right: 11px;
}
</style>
