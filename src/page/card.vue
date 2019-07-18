<template>
    <div>
        <sticky scroll-box="vux_view_box_body" :offset="isWeixin?0:46" :check-sticky-support="false">
            <tab>
                <tab-item :selected="card_type==2" @on-item-click="card_type=2">全部</tab-item>
                <tab-item :selected="card_type==0" @on-item-click="card_type=0">信用卡</tab-item>
                <tab-item :selected="card_type==1" @on-item-click="card_type=1">储蓄卡</tab-item>
            </tab>
        </sticky>
        <div class="no_record" v-if="card_count==0">
            <div class="record">
                <i class="icon icon-zanwujilu"></i>
            </div>
            暂无记录
        </div>
        <group>
            <template v-for="(item,key) in card_list">
                <cell :key="key" :title="item.bank_name" :inline-desc="(item.card_type==0?'信用卡（':'储蓄卡（') + item.number.substr(item.number.length-4) +'）'" is-link :link="'/card/'+item.id">
                    <i slot="icon" v-if="item.bank_key" :class="['bank-icon','icon-' + item.bank_key]" :style="'color:'+item.color"></i>
                    <label>{{repayDay(item)}}</label>
                    <!-- <div slot="inline-desc">{{is_number}}</div> -->
                </cell>
            </template>
        </group>
        <box gap="2em 10px">
            <x-button link="/card/add">添加银行卡</x-button>
        </box>
    </div>
</template>
<script>
import {
    Group,
    Cell,
    Tab,
    TabItem,
    Box,
    XButton,
    Sticky
} from "vux";
import {
    mapGetters,
    mapActions
} from "vuex";

export default {
    name: "card_list",
    components: {
        Group,
        Cell,
        Tab,
        TabItem,
        Box,
        XButton,
        Sticky
    },
    data() {
        return {
            card_type: 2,
            card_count: 0
        };
    },
    computed: {
        ...mapGetters(["token", "user", "cards", "btn_loading"]),
        isWeixin() {
            return window.navigator.userAgent.indexOf("MicroMessenger") != -1;
        },
        card_list() {
            let _cards = {};
            for (let key in this.cards) {
                let item = this.cards[key];
                if (
                    item.status >= 0 &&
                    (this.card_type == 2 || item.card_type == this.card_type)
                ) {
                    _cards[key] = this.cards[key];
                }
            }
            this.card_count = Object.keys(_cards).length;
            return _cards;
        }
    },
    created() {
        this.$store.commit("updatePageTitle", "银行卡");
        this.loadCards();
        if (this.$route.query.card_type) {
            this.card_type = parseInt(this.$route.query.card_type);
        }
    },
    methods: {
        ...mapActions(['loadCards']),
        repayDay(card) {
            var _result = "";
            if (card.status == 2) {
                _result = "还款中";
            } else if (card.status == 1) {
                _result = "还款未启动";
            } else if (card.repay_day) {
                var now = new Date();
                if (now.getDate() < card.repay_day) {
                    _result = "距还款日" + (card.repay_day - now.getDate()) + "天";
                }
            }
            if (card.card_type == 1 && card.id == this.user.card_id) {
                _result = "结算卡";
            }
            return _result;
        }
        // loadCard(){
        //   if(this.cards){
        //     this.model_list = this.cards;
        //     this.card_count = Object.getOwnPropertyNames(this.cards).length - 1;
        //   }
        //   this.$store.commit('updateBtnLoading',true);
        //   this.$axios.get('/api/cards').then((res)=>{
        //       this.model_list = res.data;
        //       this.card_count = Object.getOwnPropertyNames(res.data).length;
        //       this.$store.commit('updateCards',this.model_list);
        //       this.$store.commit('updateBtnLoading',false);
        //   });
        // }
    }
};
</script>
<style lang="less">
</style>
