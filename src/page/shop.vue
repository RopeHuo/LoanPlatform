<template>
    <div>
        <sticky scroll-box="vux_view_box_body" :offset="isWeixin?0:46" :check-sticky-support="false">
            <div class="shop-header">
                <div @click="showPicker('type')">{{filter.type_code?$refs.popupPicker.getNameValues().substr(0,5):'行业类型'}}</div>
                <div @click="showPicker('address')">{{filter.province||filter.city?filter.province.substr(0,3)+' '+filter.city.substr(0,3):'地区'}}</div>
                <!-- <div @click="showPicker('sort')">{{popup_data.sort_list.length>0?$refs.sort.getNameValues().substr(0,5):'智能排序'}}</div> -->
            </div>
        </sticky>
        <popup-picker @on-hide="onHideCode" ref="popupPicker" v-show="false" title="行业类型" v-model="popup_data.type_code_list" :data="type_code_list" :show="is_type"></popup-picker>
        <popup-picker @on-hide="onHideSort" ref="sort" v-show="false" title="智能排序" v-model="popup_data.sort_list" :data="sort_list" :show="is_sort"></popup-picker>
        <x-address @on-hide="onHideAddress" v-show="false" title="地区" hide-district v-model="popup_data.address" :show="is_address" :raw-value="false" placeholder="请选择商户地区" :list="addressData" value-text-align="right"></x-address>           
        <group>
            <template v-for="(item,key) in shops">
                <cell :key="key" :title="item.name" :inline-desc="typeName(item.type_code)" is-link @click.native="go(url+'?can_select_shop=1&channel_id='+filter.channel_id+'&channel_name='+filter.channel_name+'&shop_id='+item.shop_id+'&shop_name='+item.name,true)">
                <i slot="icon" v-if="item.bank_key" :class="['bank-icon','icon-' + item.bank_key]" :style="'color:'+item.color"></i>
                <label></label>
                </cell>
            </template>
        </group>
    </div>
</template>
<script>
import {
    Cell,
    Card,
    ChinaAddressV4Data,
    CellFormPreview,
    Group,
    PopupPicker,
    XAddress,
    Box,
    XButton,
    Sticky,
    Value2nameFilter as value2name
} from 'vux'

export default {
    name: 'cash',
    data() {
        return {
            url:'',
            addressData: ChinaAddressV4Data,
            filter:{
                channel_name:'',
                channel_id: '',
                type_code:'',
                province: "",
                city: ""
            },
            shops:[],
            is_address:false,
            is_type:false,
            is_sort:false,
            popup_data: {
                card_select: [],
                type_code_list: [],
                sort_list:[],
                coupon: [],
                shop:[],
                address:[]
            },
            btn_loading:false,
            code_list: [{
                    'value': '1',
                    'name': '农、林、牧、渔业'
                }, {
                    'value': '2',
                    'name': '交通运输、仓储业和邮政业'
                }, {
                    'value': '3',
                    'name': '信息传输、计算机服务和软件业'
                }, {
                    'value': '4',
                    'name': '批发和零售业'
                }, {
                    'value': '5',
                    'name': '住宿、餐饮业'
                }, {
                    'value': '6',
                    'name': '租赁和商务服务业'
                }, {
                    'value': '7',
                    'name': '水利、环境和公共设施管理业'
                }, {
                    'value': '8',
                    'name': '居民服务和其他服务业'
                }, {
                    'value': '9',
                    'name': '教育'
                }, {
                    'value': '010',
                    'name': '卫生、社会保障和社会服务业'
                }, {
                    'value': '011',
                    'name': '文化、体育、娱乐业'
                }, {
                    'value': '012',
                    'name': '其它'
                }]
        }
    },
    components: {
        Cell,
        Card,
        XAddress,
        CellFormPreview,
        Group,
        PopupPicker,
        Box,
        XButton,
        Sticky,
    },
    computed: {
        isWeixin() {
            return window.navigator.userAgent.indexOf('MicroMessenger') != -1;
        },
        type_code_list() {
            return [this.code_list];
        },
        sort_list() {
            return [[
					{ 'name': '智能排序', 'value': '1' },
					{ 'name': '距离最近', 'value': '2' },
					{ 'name': '单笔限额由高到底', 'value': '3' },
					{ 'name': '当日限额由高到底', 'value': '4' }
				]];
        },
    },
    created() {
        this.$store.commit('updatePageTitle', '落地商户');
        this.filter.channel_id = this.$route.query.channel_id;
        this.filter.channel_name = this.$route.query.channel_name;
        this.url = this.$route.query.url;
        this.loadShops();
    },
    methods: {
        typeName(code){
            if(code){
                let item = this.code_list[code] || {};
                return item.name || '其它';
            }else{
                return '其它'
            }
        },
        onHideCode(){
            this.is_type = false;
        },
        onHideSort(){
            this.is_sort = false;
        },
        onHideAddress(){
            this.is_address = false;
        },
        showPicker(value){
            switch (value) {
                case 'type':
                    this.is_type = true;
                    break;
                case 'address':
                    this.is_address = true;
                    break;
                case 'sort':
                    this.is_sort = true;
                    break;
            }
        },
        loadShops() {
            this.$axios.get('/api/shops',{params:this.filter}).then((res) => {
                this.shops = res.data;
            })
        }
    },
    watch: {
        "popup_data.address"(cur,old){
            if(cur == old){return ;}
            let address = value2name(cur, ChinaAddressV4Data)
            this.filter.province = address.split(' ')[0] || '';
            this.filter.city = address.split(' ')[1] || '';
            this.loadShops();
        },
        "popup_data.type_code_list"(cur,old){
            if(cur == old){return ;}
            this.filter.type_code = cur[0] || '';
            this.loadShops();
        },
    }
}
</script>
<style>
.shop-header{
    display: flex;
    justify-content: space-around;
    line-height: 44px;
    background-color: #fff;
}
</style>
