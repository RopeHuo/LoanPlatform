<template>  
       
    <div class="rank" >
        <flexbox>
            <flexbox-item class="flexparent"><div class="flex-demo" style="background-color: #fff;color:#000">{{current.name}}</div><div class="flex-child">当前级别</div></flexbox-item>
            <flexbox-item class="jt"></flexbox-item>
            <flexbox-item class="flexparent  VIP"><div class="flex-demo">{{next.name}}</div><div class="flex-child VIP">升级后</div></flexbox-item>
        </flexbox>

        <flexbox>
            <flexbox-item class="feilv"><div >{{current.cash.rate_fee}} %+ {{current.cash.count_fee}}</div></flexbox-item>
            <flexbox-item class="free"><div >取现</div></flexbox-item>
            <flexbox-item class="feilv VIP_FREE"><div >{{next.collect.rate_fee}} %+ {{next.collect.count_fee}}</div></flexbox-item>
        </flexbox>
        <flexbox>
            <flexbox-item class="feilv"><div >{{current.cash.rate_fee}} %+ {{current.cash.count_fee}}</div></flexbox-item>
            <flexbox-item class="free"><div >还款</div></flexbox-item>
            <flexbox-item class="feilv VIP_FREE"><div >{{next.collect.rate_fee}} %+ {{next.collect.count_fee}}</div></flexbox-item>
        </flexbox>
        <flexbox>
            <flexbox-item class="feilv"><div >{{current.cash.rate_fee}} %+ {{current.cash.count_fee}}</div></flexbox-item>
            <flexbox-item class="free"><div >提现</div></flexbox-item>
            <flexbox-item class="feilv VIP_FREE"><div >{{next.collect.rate_fee}} %+ {{next.collect.count_fee}}</div></flexbox-item>
        </flexbox>
        <scroller  lock-x scrollbar-y height="330px" ref="scroller" > 
        <div>
        <card style="border-radius: 0.8em;margin: 0.5em;">
            <div slot="header" class="upgradeone">升级计划</div>
            <flexbox slot="content" style="margin: 0.5em 0;">
                <flexbox-item style="margin-left: 1em;">
                        <p class="upgradet color">邀请{{next.condition.invite_count}}人可升级</p>
                        <p class="upgradet" v-if='next.condition.invited_count?ture:false'>已邀请 {{ next.condition.invited_count}} 人</p>
                </flexbox-item>
                <flexbox-item  style="margin-left: 4em;font-size: 1em;">
                    <x-button mini plain  type="primary" @click.native="link('/invite/share')">邀请新用户</x-button> 
                </flexbox-item>
            </flexbox >              
      </card>
      <card v-if='is_show?true:false' style="border-radius: 0.8em;margin: 0.5em;">
            <div slot="header" class="upgradeone">升级计划二</div>
            <flexbox slot="content" style="margin: 0.5em 0;">
                <flexbox-item style="margin-left: 1em;">
                        <p class="upgradet color">充值{{next.condition.used_money}}元可可升级</p>
                        <p class="upgradet"  v-if='next.condition.pay_money?ture:false'>已充值 {{ next.condition.pay_money}} 元</p>
                </flexbox-item>
                <flexbox-item  style="margin-left: 4em;font-size: 1em;">
                    <x-button mini plain  type="primary" @click.native="link('/pay?money=2300')">立即充值</x-button> 
                </flexbox-item>
            </flexbox >              
      </card>
      </div> 
       </scroller>
        <div class="weui-tabbar">
                <div style="margin: 10px;width: 100%;">
                    <x-button :show-loading="btn_loading" type="primary" @click.native="link(is_dis)" >立即升级</x-button>
                </div>
            </div> 
    </div>
     
</template>
<script>
import { Group, XHeader,Card, Cell, Tab, TabItem, Box, XButton, Flexbox, Sticky, FlexboxItem,Scroller   } from 'vux'
import {
    mapGetters,
    mapActions
} from "vuex";
import { loadavg } from 'os';


export default {
    name: "rank",
    components: {
        Flexbox,
        Group,
        XHeader,
        Cell,
        Tab,
        Card,
        TabItem,
        Box,
        XButton,
        Sticky,
        FlexboxItem,
        Scroller 
    },
    data() {
        return {
            is_show:false,
            is_dis:0,
            InvitationPeople:'',
            Recharged:null,
            OrdinaryRate:'',
            card_type: 2,
            card_count: 0,
            money:2222,
            current:{  
                cash:{rate_fee:'',count_fee:'', },
                collect:{rate_fee:'',count_fee:'', },
                condition:'',
                level:'',
                repay:'',
            },
            next:{
                cash:{rate_fee:'',count_fee:'', },
                collect:{rate_fee:'',count_fee:'', },
                condition:'',
                level:'',
                repay:'',
            }, 
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
        this.$store.commit("updatePageTitle", "等级说明");
        this._request(); 
        this.is_disable();
    },
    methods: {
        ...mapActions(['loadCards']),
        _request() {
             this.$axios.get('/api/user/upgrade' ).then((res) => {
                this.Recharged = res.data.next.condition.payed_money;
                this.InvitationPeople = res.data.next.condition.invited_count;
                this.current = res.data.current;
                this.next = res.data.next;
                this.current.cash.rate_fee = res.data.current.cash.rate_fee*100;
                this.next.collect.rate_fee = res.data.next.collect.rate_fee*100;
             })
        },
        link(links) {
            if(links == '/invite/share'){
                this.$router.push(`/invite/share?invited_count=${this.next.conditioninvited_count}`);       
            }else if(links == '/pay?money=2300'){
                this.$router.push(`/pay?money=${this.next.condition.pay_money}`);
                //  this.$router.push(`/pay?money=${this.money}`);
                // this.$router.push({path:"/pay",query:{"money":'this.money'}});
            }else if (links == 1){
                this.$axios.post('/api/user/upgrade',{}).then((res)=>{
                    this.$vux.toast.show({ text: '恭喜你，升级成功', type: 'text', time: 2000 }); 
                });
            }else if (links == 0){
                this.is_show = true;
                this.$vux.toast.show({ text: '你的升级条件不足，请先去升级吧', type: 'text', time: 2000 });
            }
        },
        is_disable() {
            if(this.next.condition.invited_count < this.next.condition.invite_count || this.next.condition.payed_money < this.next.condition.used_money  ){
                   this.is_dis= 0;
                }else {
                  this.is_dis= 1;  
            }
        },
        is_upgrade() {
           
        }

    },
    watch: {
        next: {
            handler(curVal,oldVal){
                this.is_disable();　　　　　　　　　
　　　　　　},
　　　　　　deep:true
        }
    },  
};
</script>
<style lang="less">
.rank .weui-tabbar:before{
    border-top:aliceblue
}
.rank .weui-tabbar{
    background-color:#ededed!important;
}
.jt{
    position: fixed;
    top: 7em;
    left: 50%;
    width: 0;
    height: 0;
    border-top: 1.2em solid transparent;
    border-right: 1.2em solid transparent;
    border-bottom: 1.2em solid transparent;
    border-left: 1.2em solid #1AAD19;
}
.jt::after{
    content: '升级';
    text-align: center;
    font-size: 0.8em;
    position: absolute;
    color: #fff;
    top: -0.8em;
    left: -4.2em;
    padding: 0 0 0 0.5em;
    width: 3em;
    height: 1.5em;
    background-color: #1AAD19;
}

.flexparent{
    position: relative;
    top: 0;
    left: 0;
    margin-bottom: 0.5em;
    opacity:0.7;
    font-size: 18px;
}

.flexparent .flex-child {
    font-size: 0.8em;
    position: absolute;
    top: 8em;
    left: 3.5em;
    color: #ffffff;
    width: 4.2em;
    height: 2em;
    border-radius: 5px;
    text-align: center;
    line-height: 2em;
    background-color: #1AAD19;
    z-index: 999;
    
}
.flex-demo{
    width: 6em;
    height: 6em;
    line-height: 6em;
    border-radius: 50%;
    -webkit-box-shadow: 5px -3px 8px #aaa;
    box-shadow: 5px -3px 8px #aaa;
    text-align: center;
    color: #fff;
    background-color: #FACD89;
    margin: 1.5em;
}

.feilv {
    text-align: center;
    font-size: 18px;
    color: #ccc;
    margin-bottom: 20px;
    padding-left: 0.8em;
}
.VIP_FREE{
    color: #1AAD19;
}
.free{
    position: relative;
    text-align: center;
    font-size: 18px;
    color: #000;
    margin-bottom: 20px;
}

.free::after{
    content: '';
    text-align: center;
    position: absolute;
    top: 2px;
    left: 5.22em;
    width: 0.5em;
    height:1em;
    background-color: #1AAD19;
}
 .free::before{
    content: '';
    text-align: center;
    position: absolute;
    top:1em;
    left: 5em;
    width: 0;
    height:0;
    border-top:0.5em solid #1AAD19 ;
    border-right:0.5em solid transparent;
    border-bottom:0.5em solid transparent;
    border-left:0.5em solid transparent;
}
.upgrade{
    width: 7.2em;
    border-radius: 1em;
    border: #1AAD19 1px solid;
    text-align: center;
    overflow: hidden;
    box-shadow:5px 3px 8px #aaa;
    -webkit-overflow-scrolling: touch;
    overflow-x: scroll;
    white-space: nowrap;
 }

.upgradeone{
    text-align: left;
    padding-left:1.5em; 
    width: 100%;
    height: 2em;
    color: #fff;
    line-height: 2em;
    background-color: #1AAD19;
    font-size: 20px;
    overflow: hidden;
    border-radius: 15px 15px 0 0;
}
.upgradet{
    margin : 10px 0 5px 0;
    width: 100%;
    padding-left:1.5em; 
} 
.rank .color{
    color: #1AAD19;
}
.VIP{
 opacity: 1;   
}

</style>}