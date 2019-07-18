<template>
    <div>
        <div v-if="task && !msg_data.show" class="trade-header">
            <card>
                <h3 slot="header">还款</h3>
                <h1 slot="content">{{task.total_money | money}}</h1>
                <small slot="footer">{{task.status_name}}</small>
            </card>
            <!-- <box gap="10px 10px">
        <x-button :show-loading="btn_loading" type="primary" @click.native="setTask" v-if="task.status==0">启动</x-button>
        <x-button :show-loading="btn_loading" type="warn" @click.native="setTask" v-if="task.status==1">终止</x-button>
            </box>-->
            <group>
                <cell
                    title="取消计划"
                    style="color:red"
                    is-link
                    @click.native="cancelTask"
                    v-if="task.status==0"
                ></cell>
                <cell title="修改计划" is-link :link="'/task/edit/' + task.id" v-if="task.status==0"></cell>
            </group>
            <group>
                <cell title="还款金额" :value="task.total_money | money" v-if="task.total_money"></cell>
                <cell title="还款周转金" v-if="task.need_money">
                    <span>{{task.need_money|money}}</span>
                </cell>
                <cell title="手续费" :value="task.total_fee | money" v-if="task.total_fee"></cell>
                <cell title="还款金额来源" :value="source(task.capital_type)"></cell>
                <cell title="手续费来源" :value="source(task.fee_type)"></cell>
                <cell
                    title="还款信用卡"
                    :value="card_name"
                    v-if="task.card_id"
                    is-link
                    :link="'/card/'+task.card_id"
                ></cell>
                <cell
                    title="其它银行卡"
                    :value="card_name_1"
                    v-if="task.card_id_1"
                    is-link
                    :link="'/card/'+task.card_id_1"
                ></cell>
                <cell title="优惠券" :value="task.coupon?coupon_name:'未使用'" v-if="task.coupon"></cell>
            </group>
            <group>
                <cell title="编号">
                    <small>{{task.id}}</small>
                </cell>
                <cell title="创建时间">
                    <small>{{task.created_at | dateTime}}</small>
                </cell>
                <cell
                    title="执行时间"
                    is-link
                    :arrow-direction="review_date?'up':'down'"
                    @click.native="review_date = !review_date"
                >
                    <small
                        v-if="task.date_list.length!=0"
                    >{{task.date_list[0] | date}}&nbsp;{{task.date_list[task.date_list.length-1] | date}}</small>
                    <small v-else>{{task.begin_date | date}}&nbsp;{{task.end_date | date}}</small>
                </cell>
                <template v-if="review_date">
                    <cell-box :border-intent="false" class="sub-item">
                        <div>
                            <badge
                                v-for="day in task.date_list"
                                :text="day.substr(5)"
                                :key="day"
                                style="margin-right:10px;"
                            ></badge>
                        </div>
                    </cell-box>
                </template>
                <cell
                    title="详细清单"
                    :value="task.split_count + '笔'"
                    is-link
                    :arrow-direction="review?'up':'down'"
                    @click.native="review=!review"
                ></cell>
            </group>

            <box gap="10px 10px" v-if="review && trade_loading">加载中...</box>
            <div
                class="weui-wepay-flow weui-wepay-flow_vertical"
                :style="{height:(trade_list.length+1)*70+'px',padding:'25px 25px 45px 25px'}"
                v-if="review && trade_loaded"
            >
                <div class="weui-wepay-flow__bd">
                    <template v-for="(item,index) in trade_list">
                        <div class="weui-wepay-flow__li">
                            <div class="weui-wepay-flow__state">
                                <i class="icon icon-success" v-if="item.status>=2"></i>
                                <i class="icon icon-fail" v-if="item.status<0"></i>
                                <i class="icon icon-ing" v-if="item.status==1"></i>
                            </div>
                            <span class="weui-wepay-flow__title-right">
                                <div
                                    class="content_tilte"
                                    @click="loadShop(item.id,item.trade_type)"
                                >
                                    <div class="first_row">
                                        <span>[{{item.trade_type%2==1?'消费':'还款'}}] {{item.card_id=='0'?'账户余额':cards[item.card_id].name}}</span>

                                        <span>
                                            <span
                                                :class="item.trade_type%2==1?'trade-type-1':'trade-type-0'"
                                            >{{item.money | money}}</span>
                                            <span>({{item.fee | money}})</span>
                                        </span>
                                    </div>
                                    <div class="time">
                                        <span>{{item.trade_time | dateTime}}</span>
                                        <span
                                            v-if="task.channel_id && item.trade_type%2==1"
                                        >{{item.shop_name}}</span>
                                    </div>
                                </div>
                            </span>
                        </div>

                        <div
                            :class="['weui-wepay-flow__line',item.status>=2?'weui-wepay-flow__line_done':'',item.status==1?'weui-wepay-flow__line_ing':'']"
                            :style="item.status==1?'background-color:#666':''"
                            :key="index"
                            v-if="trade_list.length!=index+1"
                        >
                            <div class="weui-wepay-flow__process" v-if="item.status!=1"></div>
                            <div class="weui-wepay-flow__process_line_ing"></div>
                        </div>
                    </template>
                    <!-- :popup-title='picker_title'-->
                    <!-- <popup-picker  v-model="address_value" :columns=2 :data="code_list" style="display:none" :show="is_show2" @on-hide="is_show2=false" @on-show="onshow"  @on-shadow-change="changepic4k" placeholder="请选商户" >
            <div :slot="title" >头部默认值</div>
                    </popup-picker>-->
                    <popup
                        v-model="is_show2"
                        :popup-style="{'zIndex': 999 }"
                        :show-mask="false"
                        hide-on-blur
                        position="bottom"
                        max-height="50%"
                    >
                        <group>
                            <popup-header
                                left-text="取消"
                                right-text="确定"
                                @on-click-left="is_show2 = false"
                                @on-click-right="quren(loadShopIds,loadShopTrade_type)"
                            >
                                <!-- <div slot="title">头部</div> -->
                                <div
                                    slot="title"
                                    @click="title_click"
                                >{{shop_type?shop_type:'农、林、牧、渔业'}}</div>
                            </popup-header>
                            <picker
                                :data="code_list"
                                :columns="1"
                                v-model="address_value"
                                @on-change="changepick_shop"
                            ></picker>
                        </group>
                    </popup>
                    <popup
                        :show-mask="false"
                        :popup-style="{'zIndex': 9999 }"
                        v-model="titleshow"
                        position="bottom"
                        max-height="50%"
                    >
                        <group>
                            <popup-header
                                left-text="取消"
                                right-text="确定"
                                @on-click-left="titleshow = false"
                                @on-click-right="titleshow = false"
                            ></popup-header>
                            <picker
                                :data="code_list2"
                                :columns="1"
                                @on-change="changepick_type"
                                v-model="address_type "
                            ></picker>
                        </group>
                    </popup>
                </div>
            </div>

            <box gap="10px 10px"></box>
            <div>
                <popup
                    v-model="iframe"
                    width="100%"
                    height="100%"
                    position="bottom"
                    :show-mask="false"
                >
                    <iframe width="100%" height="100%" scrolling="no" style="border: none;"></iframe>
                    <div style="position: fixed;bottom:0;width:100%;">
                        <x-button
                            :show-loading="btn_loading"
                            @click.native="iframe = false"
                            type="warn"
                        >关闭</x-button>
                    </div>
                </popup>
            </div>

            <div
                class="weui-tabbar"
                style="border-top:aliceblue;"
                v-if="task && !msg_data.show&&(task.status==0||task.status==1)"
            >
                <div style="margin: 10px;width: 100%;">
                    <x-button
                        :show-loading="btn_loading"
                        type="primary"
                        @click.native="setTask"
                        v-if="task.status==0"
                    >启动</x-button>
                    <x-button
                        :show-loading="btn_loading"
                        type="warn"
                        @click.native="setTask"
                        v-if="task.status==1"
                    >终止</x-button>
                </div>
            </div>

            <loading :show="status_205_data.show" :text="status_205_data.msg"></loading>
            <msg
                v-if="msg_data.show"
                :title="msg_data.title"
                :description="msg_data.description"
                :buttons="msg_data.buttons"
                :icon="msg_data.icon"
            ></msg>
            <confirm
                v-model="is_show"
                :close-on-confirm="false"
                title="验证码"
                @on-confirm="setTask()"
                @on-cancel="is_show=false"
            >
                <div>
                    <group>
                        <x-input
                            type="number"
                            placeholder="请输入短信验证码"
                            :show-clear="false"
                            v-model="valicode"
                        ></x-input>
                    </group>
                </div>
            </confirm>
        </div>
    </div>
</template>
<script>
import {
    Group,
    PopupHeader,
    PopupPicker,
    ChinaAddressV4Data,
    Popup,
    Picker,
    XSwitch,
    Card,
    CellBox,
    Badge,
    Cell,
    Box,
    Loading,
    Msg,
    XButton,
    Flow,
    FlowState,
    FlowLine,
    Confirm,
    XInput
} from "vux";
import axios from "axios";
import { mapGetters, mapActions } from "vuex";
export default {
    name: "login",
    components: {
        XSwitch,
        PopupPicker,
        PopupHeader,
        ChinaAddressV4Data,
        Picker,
        Group,
        Popup,
        CellBox,
        Badge,
        Card,
        Cell,
        Box,
        Loading,
        Msg,
        XButton,
        Flow,
        FlowState,
        FlowLine,
        Confirm,
        XInput
    },
    data() {
        return {
			loadShopIds:null,
			loadShopTrade_type:null,
            shop_type: "",
            address_type: [],
            titleshow: false,
            is_false: "",
            item_data: "",
            picker_title: "",
            shops: "",
            // popstyle:{ zIndex:999,},
            is_show22: 0,
            is_show2: false,
            address_value: [],
            task_id: "",
            review: false,
            task: {},
            card: {},
            review_date: false,
            is_show: false,
            iframe: false,
            card_1: {},
            status_205_data: { msg: "", show: false, wait: 0 },
            timer: 0,
            valicode: "",
            post_data: { validata: {} },
            trade_loaded: false,
            trade_loading: false,
            trade_list: [],
            coupon_name: "",
            msg_data: {
                show: false,
                title: "",
                description: "",
                buttons: [
                    {
                        type: "primary",
                        text: "查看计划详情"
                    },
                    {
                        type: "default",
                        text: "返回首页",
                        link: "/"
                    }
                ]
            },
            code_list2: [
                {
                    value: "1",
                    name: "农、林、牧、渔业"
                },
                {
                    value: "2",
                    name: "交通运输、仓储业和邮政业"
                },
                {
                    value: "3",
                    name: "信息传输、计算机服务和软件业"
                },
                {
                    value: "4",
                    name: "批发和零售业"
                },
                {
                    value: "5",
                    name: "住宿、餐饮业"
                },
                {
                    value: "6",
                    name: "租赁和商务服务业"
                },
                {
                    value: "7",
                    name: "水利、环境和公共设施管理业"
                },
                {
                    value: "8",
                    name: "居民服务和其他服务业"
                },
                {
                    value: "9",
                    name: "教育"
                },
                {
                    value: "010",
                    name: "卫生、社会保障和社会服务业"
                },
                {
                    value: "011",
                    name: "文化、体育、娱乐业"
                },
                {
                    value: "012",
                    name: "其它"
                }
            ],
            code_list: []
        };
    },
    created() {
        this.$store.commit("updatePageTitle", "还款计划详情");
        this.task_id = this.$route.params.id;
        this.loadTask(this.task_id);
        this.loadChannelConfig();
        this.loadShops();
    },
    computed: {
        ...mapGetters(["cards", "tasks", "btn_loading"]),
        date_list() {},
        sendName: function() {
            if (this.timer <= 0) {
                return "获取验证码";
            }
            return this.timer + "秒";
        },
        card_name() {
            let _card_name = "未知卡片";
            if (this.task.card_id) {
                if (this.cards[this.task.card_id]) {
                    _card_name = this.cards[this.task.card_id].name;
                } else {
                    this.loadCard(this.task.card_id);
                }
            }
            return _card_name;
        },
        card_name_1() {
            let _card_name = "未知卡片";
            if (this.task.card_id_1) {
                if (this.cards[this.task.card_id_1]) {
                    _card_name = this.cards[this.task.card_id_1].name;
                } else {
                    this.loadCard(this.task.card_id_1);
                }
            }
            return _card_name;
        }
    },
    methods: {
        ...mapActions(["loadCard"]),

        loadShops() {
            this.$axios
                .get("/api/shops", {
                    params: {
                        channel_id: this.task.channel_id,
                        province: this.task.province,
                        city: this.task.city,
                        page_size: 200
                    }
                })
                .then(res => {
                    this.shops = res.data;
                    // console.log(this.shops)
                    for (let i in this.shops) {
                        var shop_data = {};
                        shop_data.name = this.shops[i].name;
                        shop_data.value = this.shops[i].shop_id;
                        this.code_list.push(shop_data);
                    }
                });
        },
        updataTradeShop(id, shop_id) {
            this.$axios
                .post("/api/trade/set_shop", { id: id, shop_id: shop_id })
                .then(res => {
                    //  console.log(res.data,)
                });
        },
        loadChannelConfig(channel_key) {
            this.$axios
                .get(`/api/public/channels/channelTft2.json`)
                .then(res => {
                    // console.log('channel_key',res.data,34535)
                });
        },
        loadCoupon(coupon_id) {
            this.$axios.get("/api/coupons/" + coupon_id).then(res => {
                this.coupon_name = res.data.name;
            });
        },
        sendSMS() {
            if (this.timer > 0) {
                return;
            }
            var post_data = { mobile: this.post_data.mobile };
            try {
                var token = post_data.mobile;
                post_data.timestamp =
                    parseInt(new Date().getTime() / 1000) + "";
                var key = post_data.timestamp;
                for (var i = 0; i < key.length; i++) {
                    if (token.length <= i) {
                        break;
                    }
                    post_data.token += String.fromCharCode(
                        48 + ((token.charCodeAt(i) + key.charCodeAt(i)) % 74)
                    );
                }
            } catch (e) {}
            this.$axios.post("/api/valicode", post_data).then(res => {
                this.initTimer();
            });
        },
        initTimer() {
            this.timer = 60;
            this._timer = setInterval(() => {
                this.timer -= 1;
                if (this.timer <= 0) {
                    clearInterval(this._timer);
                }
            }, 1000);
        },
        source(type) {
            let type_name = "未知";
            if (type == 0) {
                type_name = "当前信用卡";
            } else if (type == 1) {
                type_name = "其它银行卡";
            } else if (type == 2) {
                type_name = "系统垫付";
            } else if (type == 3) {
                type_name = "余额支付";
            }
            return type_name;
        },
        taskIcon(status) {
            if (status == 2) {
                return "vux-timeline-item-success";
            }
            if (status == 1) {
                return "vux-timeline-item-doing";
            } else if (status == 0) {
                return "vux-timeline-item-waiting";
            } else if (status < 0) {
                return "vux-timeline-item-warn";
            }
        },
        loadTask(task_id) {
            if (this.tasks.length !== 0) {
                for (let index in this.tasks) {
                    if (this.tasks[index].id == task_id) {
                        this.task = this.tasks[index];
                        break;
                    }
                }
            }
            this.$axios.get("/api/tasks/" + task_id).then(res => {
                if (res.data.channel_id !== 68) {
                    this.is_show22 = 1;
                }
                this.task = res.data;
                if (this.task.coupon) {
                    this.loadCoupon(this.task.coupon);
                }
                this.$store.commit("addTask", this.task);
            });
        },
        cancelTask(confirm) {
            var that = this;
            if (confirm != 1) {
                this.$vux.confirm.show({
                    title: "取消确认",
                    content: "确定取消计划吗？取消后该计划无法重新启用",
                    onConfirm() {
                        that.cancelTask(1);
                    }
                });
                return;
            }
            this.$axios
                .post("/api/task/set", { id: this.task_id, status: -2 })
                .then(res => {
                    const self = this;
                    this.msg_data.buttons[0].onClick = function() {
                        self.msg_data.show = false;
                    };
                    this.msg_data.title = "操作成功";
                    this.msg_data.show = true;
                    this.task.status = -2;
                    this.card.status = 0;
                    this.msg_data.buttons.shift();
                    this.$store.commit("addCard", this.card);
                    this.$store.commit("removeTask", this.task);
                });
        },
        nextStep() {
            this.is_show = false;
            this.$axios
                .post("/api/task/set", {
                    id: this.task_id,
                    status: "1",
                    validata: this.post_data.validata
                })
                .then(res => {});
        },
        setTask: function(confirm) {
            this.is_show = false;
            var _status = "1";
            if (this.task.status == 1) {
                _status = "-1";
                var that = this;
                if (confirm != 1) {
                    this.$vux.confirm.show({
                        title: "停止确认",
                        content:
                            "确定中止此任务吗？已执行的计划无法暂停，已消耗的手续费与优惠券不予退还",
                        onConfirm() {
                            that.setTask(1);
                        }
                    });
                    return;
                }
            }
            this.$store.commit("updateBtnLoading", true);
            let req_data = {
                id: this.task_id,
                status: _status
            };
            if (this.is_show) {
                req_data.validata = {};
                req_data.validata = this.post_data.validata;
                req_data.validata.valicode = this.valicode;
                this.is_show = false;
            }
            let self = this;
            this.$axios.post("/api/task/set", req_data).then(res => {
                this.$store.commit("updateBtnLoading", false);
                if (res.status == 202) {
                    this.$vux.toast.show({
                        text: res.data.msg,
                        type: "text",
                        time: 3000
                    });
                    this.is_show = true;
                }
                if (res.status == 200) {
                    this.msg_data.buttons[0].onClick = function() {
                        self.msg_data.show = false;
                    };
                    this.msg_data.title = "操作成功";
                    this.msg_data.show = true;
                    if (this.task.status == 1) {
                        this.task.status = -1;
                        this.task.status_name = "已终止";
                        this.card.status = 0;
                    } else {
                        this.task.status = 1;
                        this.task.status_name = "进行中";
                        this.card.status = 2;
                    }
                    this.$store.commit("addCard", this.card);
                    this.$store.commit("addTask", this.task);
                    if (_status == "-1") {
                        this.$store.commit("removeTask", this.task_id);
                    }
                } else if (res.status == 206) {
                    self.$db.set("last_session", {
                        path: "/task/" + this.task_id,
                        data: {}
                    });
                    if (res.data) {
                        self.$vux.confirm.show({
                            title: "安全验证",
                            content: "需要验证执卡人信息",
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
                        });
                    }
                } else if (res.status == 207) {
                    if (res.headers["x-redirect"]) {
                        self.$vux.confirm.show({
                            title: "安全验证",
                            content: res.data,
                            onConfirm() {
                                if (
                                    navigator.userAgent
                                        .toLowerCase()
                                        .indexOf("micromessenger") != -1
                                ) {
                                    //判断是否微信浏览器打开
                                    location.href = res.headers["x-redirect"];
                                } else {
                                    document
                                        .querySelector("iframe")
                                        .setAttribute(
                                            "src",
                                            res.headers["x-redirect"]
                                        );
                                    self.iframe = true;
                                }
                            }
                        });
                    }
                } else if (res.status == 208) {
                    //添加结算卡
                    self.$vux.confirm.show({
                        title: res.data,
                        content: "立即前往设置！",
                        onConfirm() {
                            self.$router.push("/card?card_type=1");
                        }
                    });
                } else if (res.status == 205) {
                    //
                    this.status_205_data.show = true;
                    this.status_205_data.msg = res.data.msg;
                    this.status_205_data.wait = res.data.wait;
                    setTimeout(() => {
                        self.status_205_data.show = false;
                        self.setTask();
                    }, self.status_205_data.wait * 1000);
                }
            });
        },
        loadTrade: function() {
            if (this.trade_list.length > 0) {
                return;
            }
            axios
                .get("/api/trades?page_size=100&task_id=" + this.task_id)
                .then(res => {
                    this.trade_loaded = true;
                    this.trade_list = res.data;
                });
        },
        changepick_shop(value) {
            for (let i in this.code_list) {
                if (
                    this.code_list[i].value == value[0] &&
                    this.code_list[i].value !== null
                ) {
                    this.picker_title =
                        this.code_list[i].name.slice(0, 8) + "...";
                    console.log(this.picker_title);
                }
            }
        },
        changepick_type(val) {
            // console.log('zzz', val )
            for (let i in this.code_list2) {
                if (this.code_list2[i].value == val[0]) {
                    this.shop_type = this.code_list2[i].name;
                }
            }
        },
        loadShop(id, trade_type) {
			this.loadShopIds = id;
			this.loadShopTrade_type = trade_type;
			if (this.is_show22 !== 0 && trade_type % 2 !== 1) {
                this.is_show2 = false;
            } else {
                if (trade_type % 2 == 1) this.is_show2 = true;
			}
			for (let i in this.trade_list) {
                if (this.trade_list[i].id == id) {
                    this.trade_list[i].shop_name = this.picker_title;
                }
            }
            // console.log('changepick_type',1111111)
		},
		quren(id, trade_type){
			this.is_show2 = false
            for (let i in this.trade_list) {
                if (this.trade_list[i].id == id) {
                    this.trade_list[i].shop_name = this.picker_title;
                }
            }
		},
        onchange(id) {
            this.loadShop(id);
        },
        onshow() {
            // console.log(11111111111111111);
        },
        title_click() {
            // console.log(9999999999)
            this.titleshow = true;
        }
    },

    watch: {
        review: function(cur, old) {
            if (cur) {
                this.loadTrade();
            }
        }
    }
};
</script>
<style lang="less">
.weui-cell vux-tap-active weui-cell_access {
    padding: 0 !important;
    margin: 0 !important;
}

.vux-timeline .vux-timeline-item-tail {
    background-color: #ff9900;
}

.item-money {
    float: right;
}

.trade-type-1 {
    color: green;
}

.trade-type-0 {
    color: red;
}

.weui-wepay-flow .weui-wepay-flow__bd {
    align-items: start;
}

.weui-wepay-flow__bd .weui-wepay-flow__li .weui-wepay-flow__state {
    margin-left: -0.5em;
}

.content_tilte {
    display: block;
    width: 85vw;
    margin-left: -1em;
    padding-right: 0.5em;
}

.first_row {
    display: flex;
    line-height: 1.5em;
    justify-content: space-between;
    font-size: 1.15em;
}

.time {
    display: flex;
    justify-content: space-between;
}

.weui-wepay-flow,
.weui-wepay-flow-auto {
    padding: 40px;
}

.weui-wepay-flow__state {
    background-color: #e2e2e2;
}

.weui-wepay-flow__bd {
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.weui-wepay-flow__li {
    width: 14px;
    height: 14px;
    position: relative;
    z-index: 1;
}

.weui-wepay-flow__li .weui-wepay-flow__state {
    position: absolute;
    left: 0;
    top: 0;
    width: 14px;
    height: 14px;
    font-size: 10px;
    line-height: 14px;
    text-align: center;
    color: #fff;
    border-radius: 7px;
    box-sizing: border-box;
}

.weui-wepay-flow__li_done .weui-wepay-flow__state {
    background-color: #09bb07;
}

[class^="weui-wepay-flow__title-"],
[class*=" weui-wepay-flow__title-"] {
    position: absolute;
    color: #999999;
    font-size: 14px;
    font-weight: normal;
    white-space: nowrap;
    text-align: center;
}

.weui-wepay-flow__title-top {
    bottom: 20px;
    left: 50%;
    transform: translate(-50%, 0);
}

.weui-wepay-flow__li_done .weui-wepay-flow__title-top {
    color: #333;
}

.weui-wepay-flow__title-bottom {
    top: 20px;
    left: 50%;
    transform: translate(-50%, 0);
}

.weui-wepay-flow__li_done .weui-wepay-flow__title-bottom {
    color: #333;
}

.weui-wepay-flow__title-left {
    right: 30px;
    top: 50%;
    transform: translate(0, -50%);
    text-align: right;
}

.weui-wepay-flow__li_done .weui-wepay-flow__title-left {
    color: #333;
}

.weui-wepay-flow__title-right {
    left: 30px;
    top: 50%;
    transform: translate(0, -50%);
    text-align: left;
}

.weui-wepay-flow__li_done .weui-wepay-flow__title-right {
    color: #333;
}

[class^="weui-wepay-flow__intro-"],
[class*=" weui-wepay-flow__intro-"] {
    height: 20px;
    line-height: 20px;
    background-color: #ff8a00;
    font-size: 10px;
    color: #fff;
    white-space: nowrap;
    padding: 0 6px;
    position: relative;
    border-radius: 4px;
}

[class^="weui-wepay-flow__intro-"]:after,
[class*=" weui-wepay-flow__intro-"]:after {
    content: "";
    display: inline-block;
    width: 0;
    height: 0;
    overflow: hidden;
    font-size: 0;
    position: absolute;
}

.weui-wepay-flow__intro-top {
    bottom: 25px;
    left: 50%;
    transform: translate(-50%, 0);
    position: absolute;
}

.weui-wepay-flow__intro-top:after {
    border-color: #ff8a00 transparent transparent transparent;
    border-style: solid;
    border-width: 5px 3px;
    left: 50%;
    transform: translate(-50%, 0);
    bottom: -10px;
}

.weui-wepay-flow__intro-bottom {
    top: 25px;
    left: 50%;
    transform: translate(-50%, 0);
    position: absolute;
}

.weui-wepay-flow__intro-bottom:after {
    border-color: transparent transparent #ff8a00 transparent;
    border-style: dashed dashed solid dashed;
    border-width: 5px 3px;
    left: 50%;
    transform: translate(-50%, 0);
    top: -10px;
}

.weui-wepay-flow__intro-right {
    left: 36px;
    top: 50%;
    transform: translate(0, -50%);
    position: absolute;
}

.weui-wepay-flow__intro-right:after {
    border-color: transparent #ff8a00 transparent transparent;
    border-style: solid;
    border-width: 3px 5px;
    top: 50%;
    transform: translate(0, -50%);
    left: -10px;
}

.weui-wepay-flow__intro-left {
    right: 36px;
    top: 50%;
    transform: translate(0, -50%);
    position: absolute;
}

.weui-wepay-flow__intro-left:after {
    border-color: transparent transparent transparent #ff8a00;
    border-style: solid;
    border-width: 3px 5px;
    top: 50%;
    transform: translate(0, -50%);
    right: -10px;
}

[class^="weui-wepay-flow__info-"] {
    height: 14px;
    line-height: 14px;
    background-color: #09bb07;
    font-size: 10px;
    color: #fff;
    white-space: nowrap;
    padding: 0 6px;
    position: relative;
    border-radius: 2px;
    position: absolute;
}

[class^="weui-wepay-flow__info-"]:after {
    content: "";
    display: inline-block;
    width: 0;
    height: 0;
    overflow: hidden;
    font-size: 0;
    position: absolute;
}

.weui-wepay-flow__line_ing [class^="weui-wepay-flow__info-"] {
    display: block;
}

.weui-wepay-flow__info-top {
    display: none;
    left: 50%;
    transform: translate(-50%, 0);
    bottom: 11px;
}

.weui-wepay-flow__line_ing .weui-wepay-flow__info-top {
    display: block;
}

.weui-wepay-flow__info-top:after {
    border-color: #09bb07 transparent transparent transparent;
    border-style: solid;
    border-width: 5px 3px;
    left: 50%;
    transform: translate(-50%, 0);
    bottom: -10px;
}

.weui-wepay-flow__info-bottom {
    display: none;
    left: 50%;
    transform: translate(-50%, 0);
    top: 11px;
}

.weui-wepay-flow__line_ing .weui-wepay-flow__info-bottom {
    display: block;
}

.weui-wepay-flow__info-bottom:after {
    border-color: transparent transparent #09bb07 transparent;
    border-style: dashed dashed solid dashed;
    border-width: 5px 3px;
    left: 50%;
    transform: translate(-50%, 0);
    top: -10px;
}

.weui-wepay-flow__info-left {
    display: none;
    top: 50%;
    transform: translate(0, -50%);
    right: 12px;
}

.weui-wepay-flow__line_ing .weui-wepay-flow__info-left {
    display: block;
}

.weui-wepay-flow__info-left:after {
    border-color: transparent transparent transparent #09bb07;
    border-style: solid;
    border-width: 3px 5px;
    top: 50%;
    transform: translate(0, -50%);
    right: -10px;
}

.weui-wepay-flow__info-right {
    display: none;
    top: 50%;
    transform: translate(0, -50%);
    left: 12px;
}

.weui-wepay-flow__line_ing .weui-wepay-flow__info-right {
    display: block;
}

.weui-wepay-flow__info-right:after {
    border-color: transparent #09bb07 transparent transparent;
    border-style: solid;
    border-width: 3px 5px;
    top: 50%;
    transform: translate(0, -50%);
    left: -10px;
}

.weui-wepay-flow__line {
    flex: 1;
    background-color: #e2e2e2;
    height: 3px;
    position: relative;
}

.weui-wepay-flow__title {
    color: #999999;
    font-size: 14px;
    font-weight: normal;
}

.weui-wepay-flow__info {
    color: #999999;
    font-size: 12px;
}

.weui-wepay-flow__process {
    display: none;
    background-color: #09bb07;
    height: 3px;
    position: relative;
}

.weui-wepay-flow__process_line_ing {
    display: none;
    background-color: #666;
    height: 3px;
    position: relative;
}

.weui-wepay-flow__line_ing .weui-wepay-flow__process {
    display: block;
    width: 50%;
}

.weui-wepay-flow__line_done .weui-wepay-flow__process {
    display: block;
}

.weui-wepay-flow_custom .weui-wepay-flow__bd {
    justify-content: flex-start;
}

.weui-wepay-flow_custom .weui-wepay-flow__line {
    flex: none;
    width: 100px;
}

.weui-wepay-flow_vertical .weui-wepay-flow__bd {
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.weui-wepay-flow_vertical .weui-wepay-flow__line {
    height: auto;
    width: 3px;
}

.weui-wepay-flow_vertical
    .weui-wepay-flow__line_ing
    .weui-wepay-flow__process_line_ing {
    height: 50%;
}

.weui-wepay-flow_vertical .weui-wepay-flow__process {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
}

.weui-wepay-flow_vertical
    .weui-wepay-flow__line_done
    .weui-wepay-flow__process {
    height: 100%;
}

.weui-wepay-flow_vertical-custom .weui-wepay-flow__bd {
    flex-direction: column;
    height: 100%;
    box-sizing: border-box;
}

.weui-wepay-flow_vertical-custom .weui-wepay-flow__line {
    width: 3px;
    flex: none;
}

.weui-wepay-flow_vertical-custom
    .weui-wepay-flow__line_ing
    .weui-wepay-flow__process {
    height: 50%;
}

.weui-wepay-flow_vertical-custom .weui-wepay-flow__process {
    position: absolute;
    left: 0;
    top: 0;
    height: 100%;
    width: 3px;
}

.weui-wepay-flow_vertical-custom
    .weui-wepay-flow__line_done
    .weui-wepay-flow__process {
    height: 100%;
}

.weui-wepay-flow-auto {
    position: relative;
}

.weui-wepay-flow-auto__bd {
    position: relative;
}

.weui-wepay-flow-auto__state {
    position: absolute;
    left: 0;
    top: 4px;
    width: 14px;
    height: 14px;
    font-size: 10px;
    line-height: 14px;
    text-align: center;
    color: #fff;
    border-radius: 7px;
    background-color: #e2e2e2;
    z-index: 2;
}

.weui-wepay-flow-auto__state_on {
    background-color: #09bb07;
}

.weui-wepay-flow-auto__line {
    position: absolute;
    width: 2px;
    background-color: #dddddd;
    top: 10px;
    bottom: -4px;
    left: 6px;
    z-index: 1;
}

.weui-wepay-flow-auto__line_on {
    background-color: #09bb07;
}

.weui-wepay-flow-auto__li {
    position: relative;
    padding-bottom: 20px;
    padding-left: 30px;
}

.weui-wepay-flow-auto__title {
    color: #999999;
    font-size: 14px;
    font-weight: normal;
}

.weui-wepay-flow-auto__info {
    color: #999999;
    font-size: 12px;
}

.picker-buttons {
    margin: 0 15px;
}
</style>
