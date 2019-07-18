<template>
	<div>
		<div v-if="!msg_data.show">
			<group gutter="0">
				<cell :title="card?card.bank_name:'请选择银行卡'" :value="card_name" :inline-desc="card?'还款日：' + repay_day:'信用卡'" @click.native="popup_status.card_select=true" :is-link="!id">
					<i slot="icon" v-if="card" :class="['bank-icon','icon-' + card.bank_key]" :style="'color:'+card.color"></i>
				</cell>
				<popup-picker title="信用卡" v-model="popup_data.card_select" :data="card_list" style="display:none" :show="!id && popup_status.card_select" @on-hide="popup_status.card_select=false" placeholder="请选信用卡" popup-title="请选信用卡"></popup-picker>
				<div v-if="card && !card.is_valid">
					<x-input text-align="right" :show-clear="false" type="number" :max="4" title="有效期" placeholder="示例:04/25,输入0425" v-model="task.expire_time">
						<div slot="right" @click="confirmMsg('expire_time')">
							<icon slot="right" type="info-circle"></icon>
						</div>
					</x-input>
					<x-input text-align="right" :show-clear="false" type="number" :max="3" title="校验码" placeholder="卡背面末3位" v-model="task.safe_code">
						<div slot="right" @click="confirmMsg('safe_code')">
						<icon type="info-circle"></icon>
						</div>
					</x-input>
				</div>
			</group>
			<group>
				<x-input class="task_money" text-align="center" type="number" :max="1000000" placeholder="请输入还款金额" :debounce="1000" @on-change="changeMoney" v-model="task.total_money"></x-input>
				<cell title="还款次数" primary="content" :inline-desc="'分' + task.split_count + '次还款'">
					<range :min="split_count_min" :max="split_count_max" v-model="task.split_count"></range>
				</cell>
			</group>
			<group>
				<x-switch title="高级设置" v-model="is_setting"></x-switch>
				<template v-if="is_setting">
					<cell title="通道" :value="task.channel_id&&task.channel_name?task.channel_name:'未选择'" :link="'/channel?url=/task/add&channel_id='+task.channel_id"></cell>
					<x-address ref="address" v-if="task.channel_id&&task.can_select_shop==1" :popup-title="popupTitle"  title="商户地区" v-model="task.address" @on-shadow-change="onShadowChange"  hide-district placeholder="请选择" :list="address_array" value-text-align="right">  
						 </x-address>
					<calendar v-model="task.date_list" :start-date="start_date" :end-date="end_date" :display-format="displayFormat" title="制定还款时间" show-popup-header popup-header-title="请选择还款日期"></calendar>
					<popup-picker title="周转金来源" :data="capital_type_list" v-model="popup_data.capital_type" :columns="2" :fixedColumns="2" placeholder="请选择" popup-title="请选择周转金来源" :display-format="capitalType"></popup-picker>
					<popup-picker title="服务费来源" :data="fee_type_list" v-model="popup_data.fee_type" :columns="2" :fixedColumns="2" placeholder="请选择" popup-title="请选择服务费来源" :display-format="feeType"></popup-picker>
					<cell title="其他银行卡" v-if="task.card_id_1" :value="cards[task.card_id_1].name" @click.native="popup_status.card_select_1=true" :is-link="true">
						<small slot="inline-desc">卡片可用额度不低于{{card_1_money}}元</small>
					</cell>
					<popup-picker title="银行卡" v-model="popup_data.card_select_1" :data="card_list_1" v-show="false" :show="popup_status.card_select_1" @on-hide="popup_status.card_select_1=false" placeholder="请选来源卡" popup-title="请选来源卡"></popup-picker>
					<x-switch title="金额取整" v-model="task.is_setting"></x-switch>
				</template>
			</group>
			<group>
				<popup-picker title="红包" :data="coupon_list" v-model="popup_data.coupon" :columns="2" :fixedColumns="2" :placeholder="coupon_status" popup-title="请选择红包" :display-format="feeType" :disabled="coupon_list.length<=1"></popup-picker>
				<x-input title="还款周转金" text-align="right" :show-clear="false" placeholder="0.00" type="number" :readonly="need_money_readonly" v-model="task.need_money">
				<div slot="right" @click="confirmMsg('need_money');need_money_readonly=false">
					<icon type="info-circle"></icon>
				</div>
				</x-input>
				<cell title="服务费" is-link :arrow-direction="review_fee?'up':'down'" @click.native="review_fee = !review_fee" :value="real_fee | money">
				<div slot="right" @click="confirmMsg('fee')">
					<icon type="info-circle"></icon>
				</div>
				</cell>
				<cell-form-preview v-if="review_fee" :list="fee_list"></cell-form-preview>
				<x-switch title="预览计划" v-model="review"></x-switch>
			</group>
			<flow orientation="vertical" :style="{height:(trade_list.length+1)*60+'px',padding:'25px 25px 45px 25px'}" v-if="review && task.trade_maked">
				<template v-for="(item,index) in trade_list">
					<flow-state :key="index" :is-done="item.status==2?true:false">
						<div slot="title" class="content_tilte">
							<div class="first_row">
								<span>[{{item.trade_type_name}}] {{item.card_id=='0'?'账户余额':cards[item.card_id].name}}</span>
								<span :class="item.trade_type%2==1?'trade-type-1':'trade-type-0'">{{item.money | money}}</span>
							</div>
							<div class="time">
								<span>{{item.trade_time | dateTime}}</span>
								<span>{{item.fee | money}}</span>
							</div>
						</div>
					</flow-state>
					<flow-line :key="index" :is-done="item.status==2?true:false" :process-span="item.status==1?50:0" v-if="(index+1)!=trade_list.length"></flow-line>
				</template>
			</flow>
			<div style="margin-bottom:60px"> </div>
			<div class="weui-tabbar" style="border-top:aliceblue;">
				<div style="margin: 10px;width: 100%;">
				<x-button :show-loading="btn_loading" type="primary" @click.native="creatTask">{{id?'确认修改':'生成计划'}}</x-button>
				</div>
			</div>
			<confirm v-model="confirm_data.model" :title="confirm_data.title" :show-cancel-button="false">
				<img width="200px" height="115px" v-if="confirm_data.img" :src="confirm_data.img">
				<p v-html="confirm_data.text"></p>
			</confirm>
			<confirm v-model="is_valicode" :close-on-confirm="false" title="验证码" @on-confirm="taskCheck()" @on-cancel="is_valicode=false">
				<div>
				<group>
					<x-input type="number" id="valicode" placeholder="请输入短信验证码" :show-clear="false" @on-change="checkValue()" v-model="check_data.validata.valicode"></x-input>
				</group>
				</div>
			</confirm>
		</div>
		<msg v-if="msg_data.show" :title="msg_data.title" :description="msg_data.description" :buttons="msg_data.buttons" :icon="msg_data.icon"></msg>
	</div>
</template>
<script>
import { Group, Box, Calendar,XAddress, Confirm, Divider, Cell, ChinaAddressV4Data, Icon, CellFormPreview, Msg, Range, Popup, Flow, FlowState, FlowLine, PopupHeader, PopupPicker, XButton, XInput, XSwitch,Name2valueFilter as name2value } from 'vux'
import { mapGetters, mapActions } from 'vuex'

export default {
	name: 'login',
	components: {
		Group,
		Box,
		Calendar,
		Confirm,
		Divider,
		Cell,
		Icon,
		CellFormPreview,
		Msg,
		Range,
		Popup,
		PopupHeader,
		PopupPicker,
		XButton,
		XInput,
		XSwitch,
    	XAddress,
		Flow,
		FlowState,
		FlowLine,
	},
	data() {
		return {
			title_data:'',
			popupTitle:'',
			address_array:[],
			id: '',
			step: 0,
			fee: 0,
			task_add: true,
			review_fee: false,
			review: false,
			is_valicode: false,
			addressData: ChinaAddressV4Data,
			need_money_readonly: true,
			status_205_data: { msg: '', show: false, wait: 0, },
			task: {
				card_id: '',
				safe_code: '',
				valicode: '',
				card_id_1: '',
				sign: '',
				capital_type: '0',
				fee_type: '0',
				card_id: '',
				total_money: null,
				split_count: 5,
				trade_maked: false,
				expire_time: '',
				total_fee: 0,
				discount_fee: 0,
				coupon: '',
				date_list: [],
				channel_id: '',
				province: '',
				city: '',
				channel_name: '',
				can_select_shop: '',
				address:[],
				
			},
			confirm_data: { title: '说明', model: false, text: '', img: '' },
			isShowConpons: false,
			popup_data: { card_select: [], card_select_1: [], begin_date: [], end_date: [], capital_type: ['0'], fee_type: ['0'], coupon: [] },
			popup_status: { card_select: false, capital_type: false, fee_type: false, coupon: false },
			is_setting: false,
			split_count_min: 2,
			split_count_max: 20,
			capital_type_list: [{ name: '当前信用卡', value: '0' }, { name: '其它银行卡', value: '1' }, { name: '系统垫付', value: '2' }],
			fee_type_list: [{ name: '当前信用卡', value: '0' }, { name: '其它银行卡', value: '1' }, { name: '平台账户余额', value: '3' }],
			fee_list: [],
			trade_list: [],
			has_card: false,
			added_fee: 0,
			btn_value: '',
			check_data: { id: '', validata: {} },
			msg_data: {
				show: false,
				title: '',
				description: '',
				icon: 'success',
				buttons: [{
				type: 'primary',
				text: '立即执行',
				link: ''
				}, {
				type: 'default',
				text: '查看计划详情',
				link: '/task/' + this.id
				}, {
				type: 'default',
				text: '返回卡包',
				link: '/card'}]
			},
			displayFormat(value, type) {
				if (type === 'string') {
				return value
				} else {
				return value.length ? (value.length + ' 天') : '未选择'
				}
			}
		}
	},
	created() {	
		var task_id = this.$route.params.id;
		if (task_id) {
			this.id = task_id;
		}
		if (this.id) {
			this.$store.commit('updatePageTitle', '修改还款计划');
		} else {
			this.$store.commit('updatePageTitle', '创建还款计划');
		}
		this.task.card_id = this.$route.query.card_id;
		if (this.$route.query.channel_id) {
			this.task = this.$db.get("task");
			this.is_setting = true;
		}
		this.task.channel_id = this.$route.query.channel_id;
		this.task.channel_name = this.$route.query.channel_name;
		this.task.channel_key = this.$route.query.channel_key;
		this.task.can_select_shop = this.$route.query.can_select_shop;
		if (!task_id && (this.$isNull(this.card_list) || this.card_list[0].length <= 1 || !this.task.card_id)) {
			let self = this;
			self.$vux.confirm.show({
				title: '添加卡片',
				content: '暂无可用的信用卡，请立即添加',
				confirm_text: '添加',
				onCancel() {
					if (!self.task.card_id && self.card_list[0].length <= 1) {
						self.$router.replace('/');
					}
				},
				onConfirm() {
					self.$db.set('path', { path: '/task/add', data: { status: 0, msg: '添加信用卡还款' } })
					self.$router.replace('/card/add?step=0');
					self.task_add = false;
				}
			})
			return;
		}
		if(this.task.can_select_shop == 1){ 
			this.loadLocation();
		}
		this.loadConfig();
		this.loadCards();
		this.loadChannelConfig('channelTft2');
		this.loadCoupons({ status: 1 });
		if (this.id) {
			this.loadTask(this.id);
		}
		this.shop_data()
		console.log(this.popup_data)
		
		
	},
  computed: {
	...mapGetters(['user', 'cards', 'tasks', 'config', 'bank_list', 'coupons', 'btn_loading']),
	start_date() { //
		if (this.$isNull(this.card) || !this.card.bill_day) { return; }
		var now = new Date();
		var day = now.getDate();
		var month = now.getMonth() + 1;
		var year = now.getFullYear();
		var bill_day = this.card.bill_day;
		var repay_day = this.card.repay_day;
		if (bill_day < repay_day) { //账单日和还款日 不跨月
			if (day < repay_day) { //还在账单日到还款日时间段
				if (day < bill_day) {
					return year + '-' + (month > 9 ? month : '0' + month) + '-' + (bill_day > 9 ? bill_day : '0' + bill_day);
				} else {
					return year + '-' + (month > 9 ? month : '0' + month) + '-' + (day > 9 ? day : '0' + day);
				}
			} else {
				if (day < bill_day) {
					return year + '-' + ((month + 1) > 9 ? (month + 1) : '0' + (month + 1)) + '-' + (bill_day > 9 ? bill_day : '0' + bill_day);
				} else {
					return year + '-' + ((month + 1) > 9 ? (month + 1) : '0' + (month + 1)) + '-' + (day > 9 ? day : '0' + day);
				}
			}
		} else { //跨月
			if (day < repay_day) { //还在账单日到还款日时间段
			return year + '-' + (month > 9 ? month : '0' + month) + '-' + (day > 9 ? day : '0' + day);
			} else {
			return year + '-' + (month > 9 ? month : '0' + month) + '-' + (bill_day > 9 ? bill_day : '0' + bill_day);
			}
		}
	},
	end_date() { //结束时间
		if (this.$isNull(this.card) || !this.card.bill_day) { return; }
		var now = new Date();
		var day = now.getDate();
		var month = now.getMonth() + 1;
		var year = now.getFullYear();
		var end_day = (new Date(now.getFullYear(), month, 0)).getDate();
		var bill_day = this.card.bill_day;
		var repay_day = this.card.repay_day;
		var _day = repay_day * 1 - this.repay_config.before_days * 1;

		let day_num = 31;
		if ([1, 3, 5, 7, 8, 10, 12].indexOf(month) != -1) { //大月
			day_num = 31;
		} else if ([4, 6, 9, 11].indexOf(month) != -1) { //小月
			day_num = 30;
		} else if (year % 4 == 0 && [2].indexOf(month) != -1) { //闰年  不考虑除以100 
			day_num = 29;
		} else {
			day_num = 28;
		}

		if (bill_day < repay_day) { //账单日和还款日 不跨月
			if (day < repay_day) { //还在账单日到还款日时间段      
				return year + '-' + (month > 9 ? month : '0' + month) + '-' + (_day > 9 ? _day : '0' + _day);
			} else { //过了本月的还款日期
				return year + '-' + ((month + 1) > 9 ? (month + 1) : '0' + (month + 1)) + '-' + (_day > 9 ? _day : '0' + _day);
			}
		} else { //跨月
			if (day < repay_day) { //还在账单日到还款日时间段
				return year + '-' + (month > 9 ? month : '0' + month) + '-' + (_day > 9 ? _day : '0' + _day);
			} else { //过了本月的还款日期
				if (_day > 0) {
					return year + '-' + ((month + 1) > 9 ? (month + 1) : '0' + (month + 1)) + '-' + (_day > 9 ? _day : '0' + _day);
				} else {
					return year + '-' + (month > 9 ? month : '0' + month) + '-' + ((day_num + _day) > 9 ? (day_num + _day) : '0' + (day_num + _day));
				}
			}
		}
	},
	repay_config() {
		let config = this.config.repay || {};
		if (this.$route.query.count_fee) {
			config.count_fee = this.$route.query.count_fee || this.config.collect.count_fee;
		}
		if (this.$route.query.rate_fee) {
			config.rate_fee = this.$route.query.rate_fee || this.config.collect.rate_fee;
		}
		return config;
	},
	card() {
		let _card = {};
		try {
			_card = this.cards[this.task.card_id];
			if (!this.id && _card.status != 0) {
			this.$vux.toast.show({ text: '该卡片正在还款中,不能进行其它交易', type: 'text', time: 3000 });
			this.task.card_id = '';
			this.popup_data.card_select = [];
			_card = {};
			}
		} catch (e) {}
		return _card;
	},
	card_list() {
		var _card_list = [];
		for (let _card_id in this.cards) {
			let _card = this.cards[_card_id];
			if (_card.card_type == 0) { //信用卡
			if (!this.task.card_id && _card.status == 0) { this.task.card_id = _card.id; }
			_card_list.push({ 'name': (_card.status != 0 ? '还款中: ' : '') + _card.name, 'value': _card.id });
			}
		}
		_card_list.push({ 'name': '+添加信用卡', 'value': '0' })
		return [_card_list] || [];
	},
	card_list_1() {
		var _card_list = [];
		for (let _card_id in this.cards) {
			let _card = this.cards[_card_id];
			if (this.task.card_id != _card.id) { //选择扣费的其它银行卡
			_card_list.push({ 'name': (_card.status != 0 ? '还款中: ' : '') + _card.name, 'value': _card.id });
			}
		}
		_card_list.push({ 'name': '+添加银行卡', 'value': '0' })
		return [_card_list];
	},
	card_1_money() {
		var _money = 0;
		if (this.task.capital_type == 1) {
			_money += this.task.need_money;
		}
		if (this.task.fee_type == 1) {
			_money += this.real_fee;
		}
		return _money;
	},
	real_fee() {
	  	return this.task.total_fee - this.task.discount_fee;
	},
	coupon_list() { //红包列表  coupon_list格式[{name:'',value:''}]
		let arr = [{ name: '请选择', value: '' }];
		for (let i in this.coupons) {
			arr.push({ name: this.coupons[i].name, value: this.coupons[i].id });
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
	card_name: function() {
		let card_num = '';
		let last_num = '请选择';
		if (!this.$isNull(this.card) && this.card.number) {
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
	repay_day: function() {
		if (!this.$isNull(this.card)) {
			return this.card.repay_day + '日';
		} else {
			return '';
		}
	}
  },
  methods: {
	...mapActions(['loadCoupons', 'loadCards']),
	
    loadChannelConfig(channel_key){
		this.$axios.get(`/api/public/channels/${channel_key}.json`).then((res)=>{
			this.title_data = res.data
			let arr=[]
			for(let key in res.data ){
				arr.push (key);
				for(let key2 in res.data[key] ){
					arr.push (key2);
				};	
			}
			for(let i in arr){
				let name = arr[i];	
				for(let j in ChinaAddressV4Data){
					let item = ChinaAddressV4Data[j];
					if(name.indexOf(item.name)!==-1){
						this.address_array.push(item);
					}
				}
			}			
		})
    },
	loadLocation() {
		this.$axios.get('/api/user/location').then((res) => {
			this.task.province = res.data.region;
			this.task.city = res.data.city;
			console.log('location',name2value([res.data.region+'省',res.data.city+'市'],ChinaAddressV4Data).split(' '))
			this.task.address = name2value([res.data.region+'省',res.data.city+'市'],ChinaAddressV4Data).split(' ');
		})
	},
	updateReviewTask() {
		this.review = false;
		this.trade_list = [];
		this.task.trade_maked = false;
	},
	checkValue() {
		if (this.task.valicode.length >= 4) {
			this.btn_value = document.getElementById('valicode');
			this.btn_value.innerHTML = this.task.valicode.substring(0, 4);
			this.task.valicode = this.task.valicode.substring(0, 4);
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
			this.confirm_data.title = '服务费说明';
			this.confirm_data.text = '还款金额*' + this.repay_config.rate_fee + '+拆分次数';
		} else if (type = 'need_money') {
			this.confirm_data.title = '还款周转金说明';
			this.confirm_data.text = '还款周转金 = 还款金额 / 还款次数<br/>还款次数越多,周转金要求越少';
		}
	},
	taskIcon(status) {
		if (status == 2) {
			return 'vux-timeline-item-success';
		}
		if (status == 1) {
			return 'vux-timeline-item-doing';
		} else if (status == 0) {
			return 'vux-timeline-item-waiting';
		} else if (status < 0) {
			return 'vux-timeline-item-warn';
		}
	},
	initTask: function() {
		if (!this.card) { return; }
		if (!this.$isNull(this.task)) {
			// this.task.begin_date = this.task.begin_date.split('T')[0].split('-').slice(1,3);
			// this.task.end_date = this.task.end_date.split('T')[0].split('-').slice(1,3);
			// return;
		} else {
			if (this.card.status != 0) {
			this.$vux.toast.show({ text: '该卡片有尚未完成的还款计划', type: 'text', time: 3000 });
			this.card_popup_data.pop();
			return;
			}
		}
		var now = new Date();
		var day = now.getDate();
		var month = now.getMonth();
		var sDay = 86400000;
		var end_day = (new Date(now.getFullYear(), month, 0)).getDate();
		var repay_day = this.card.repay_day;
		if (repay_day == 0) { repay_day = end_day; }
		if (repay_day - this.repay_config.before_days <= day + 1) {
			month += 1;
			if (month > 12) {
			month = 1;
			year += 1;
			}
			if (day < repay_day) {
			now = new Date(now.getTime() + (repay_day - day) * sDay);
			}
		}
		now = new Date();
		if (this.task.card_id) {
			this.popup_data.card_select = [this.task.card_id];
		}
		if (this.task.card_id_1) {
			this.popup_data.card_select_1 = [this.task.card_id_1];
		}
		this.popup_data.begin_date = [String(now.getMonth() + 1), String(now.getDate())];

		repay_day = new Date(now.getFullYear(), month, repay_day);
		repay_day = new Date(repay_day.getTime() - this.repay_config.before_days * sDay);
		this.popup_data.end_date = [String(repay_day.getMonth() + 1), String(repay_day.getDate())];
		this.updateCount(0);
	},
	creatTask: function() {
		if (!this.task.card_id) {
			this.$vux.toast.show({ text: '请选择银行卡', type: 'text', time: 3000 });
			return;
		}
		if (!this.task.total_money) {
			return this.$vux.toast.show({ text: '请输入还款金额', type: 'text', time: 3000 });
		}
		if(this.task.address.length>0){
			let _address = this.$refs.address.getAddressName()
			this.task.province = _address.split(' ')[0]
			this.task.city = _address.split(' ')[1]
			// console.log('_address',_address)
		}
		
		this.$store.commit('updateBtnLoading', true);
		let self = this;
		this.$axios.post('/api/tasks', this.task).then((res) => {
			this.$store.commit('updateBtnLoading', false);
			this.card.status = 1;
			this.$store.commit('addCard', this.card); //更新缓存的卡片状态
			this.$store.commit('addTask', res.data);
			this.check_data.id = res.data.id;
			this.taskCheck();
		})
	},
	taskCheck() {
		this.is_valicode = false;
		const self = this;
		this.$axios.post('/api/task/check', this.check_data).then((res) => {
			if (res.status == 200) {
				this.msg_data.buttons[1].link = '/task/' + this.check_data.id;
				this.card.is_valid = true;
				this.$vux.toast.show({ text: this.id ? '修改计划成功' : '创建计划成功' })
				
				this.$router.replace('/task/' + this.check_data.id );

			} else if (res.status == 202) {
				this.$vux.toast.show({ text: res.data.msg, type: 'text', time: 3000 });
				// this.check_data.validata = res.data.validata;
				this.is_valicode = true;
			} else if (res.status == 206) {
			self.$db.set('last_session', { path: '/task/' + this.check_data.id, data: {} });
				if (res.data) {
					self.$vux.confirm.show({
					title: '安全验证',
					content: '需要验证执卡人信息',
					onConfirm() {
						document.write(res.data);
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
				}, self.status_205_data.wait * 1000);
			}
		})
	},
	startTask: function() { //启动计划
		this.$axios.post('/api/task/set', { id: this.id, status: 1 }).then((res) => {
			this.msg_data.show = true;
			this.msg_data.title = '操作成功';
			this.msg_data.description = '';
			this.msg_data.buttons[0].text = '任务详情'
			this.msg_data.buttons[0].link = '/task/' + this.id;
		})
	},
	reviewTask: function() { //计划预览
		if (this.trade_list.length != 0) { return; }
		this.$axios.post('/api/task/trade', this.task).then((res) => {
			this.task.trade_maked = true;
			this.$store.commit('updateBtnLoading', false);
			this.trade_list = res.data;
			this.task.sign = res.headers['x-sign'];
			//this.task = Object.assign({},this.task);
		}).catch((e) => { this.updateReviewTask(); })
	},
	changeMoney() {
		this.task.trade_maked = false; //
		// if(this.task.total_money > 0 && this.task.total_money < this.repay_config.min_money){
		//   this.$vux.toast.show({text:'最低还款金额不能少于' + this.repay_config.min_money,type:'warn',time:3000});
		//   this.task.total_money = null;
		// }
		this.updateFee();
		this.updateReviewTask();

	},
	updateCount: function() {
		if (this.popup_data.begin_date.length == 0 || this.popup_data.end_date.length == 0 || this.popup_data.begin_date[1] == 0 || this.popup_data.end_date[1] == 0) {
			return;
		}
		if (this.$isNull(this.repay_config) || this.repay_config.max_daily) {
			return;
		}
		var now = new Date();
		var year = now.getFullYear();
		var begin_date = new Date(year, this.popup_data.begin_date[0] - 1, this.popup_data.begin_date[1]);
		if (this.popup_data.begin_date[0] == 12 && this.popup_data.end_date[0] == 1) {
			year += 1;
		}
		var end_date = new Date(year, this.popup_data.end_date[0] - 1, this.popup_data.end_date[1]);
		var days = (end_date - begin_date) / 1000 / 3600 / 24;
		if (days < 1) {
			this.$vux.toast.show({ text: '结束时间必须大于开始时间' + this.config.min_days + '天', type: 'text', time: 3000 });
			return;
		}
		this.split_count_max = days * this.repay_config.max_daily;
		if (this.split_count_max > this.repay_config.max_count) {
			this.split_count_max = this.repay_config.max_count * 1;
		}
		if (this.split_count_max > 21) { //默认次数
			this.task.split_count = 2;
		} else {
			this.task.split_count = 2;
		}
		if (this.repay_config.min_count) {
			this.split_count_min = this.repay_config.min_count * 1;
		}
	},
	updateFee: function() {
		this.task.need_money = 0;
		this.task.total_fee = 0;
		let total_money = Math.abs(this.task.total_money);
		// if(this.task.total_money<this.repay_config.min_money){
		//   return;
		// }
		if (total_money <= 0) {
			return;
		}
		if (this.$isNull(this.repay_config)) {
			return;
		}
		this.fee_list = [];

		this.review = false;
		this.task.trade_maked = false;
		this.task.total_fee = Math.ceil((this.task.split_count * this.repay_config.count_fee + total_money * this.repay_config.rate_fee) * 100) / 100;
		this.task.need_money = Math.ceil(total_money / this.task.split_count);

		this.fee_list.push({ label: `还款=总额x${(this.repay_config.rate_fee*100).toFixed(2)}%+次数x${(this.repay_config.count_fee*1).toFixed(2)}/笔`, value: (this.task.total_fee * 1).toFixed(2) });
		let total_fee = this.task.total_fee;
		let added_fee_label = '';
		if (this.task.fee_type != 0) { //从其它地方来的服务费
			this.task.total_fee = this.task.total_fee * 1 + this.task.total_fee * this.repay_config.rate_fee;
			if (added_fee_label) {
				added_fee_label += '+';
			}
			added_fee_label += `服务费x${(this.repay_config.rate_fee*100).toFixed(2)}%`;
		}
		if (this.task.capital_type == 1) { //从其它地方来的周转金
			this.task.total_fee = this.task.total_fee * 1 + this.task.need_money * this.repay_config.rate_fee;
			if (added_fee_label) {
				added_fee_label += '+';
			}
			added_fee_label += `周转金x${(this.repay_config.rate_fee*100).toFixed(2)}%`;
		}
		if (this.task.capital_type == 1 || (this.task.fee_type != 0 && this.task.capital_type == 2) || this.task.fee_type == 1) {
			if (added_fee_label) {
				added_fee_label += '+';
			}
			added_fee_label += `${(this.repay_config.count_fee*1).toFixed(2)}/笔`;
			//周转金要刷回去
			this.task.total_fee = this.task.total_fee * 1 + this.repay_config.count_fee * 1;
		}
		this.task.total_fee = (Math.ceil(this.task.total_fee * 100) / 100).toFixed(2);
		this.added_fee = this.task.total_fee - total_fee;
		if (this.added_fee > 0) {
			this.added_fee = (Math.ceil(this.added_fee * 100) / 100).toFixed(2);
			this.fee_list.push({ label: `附加=${added_fee_label}`, value: this.added_fee });
		}
		if (this.task.coupon) {
			let amount = 0;
			for (let i in this.coupons) {
				if (this.coupons[i].id == this.task.coupon) {
					amount = this.coupons[i].amount * 1;
				}
			}
			if (this.task.total_money > amount) {
				this.task.discount_fee = (Math.ceil(this.task.total_fee * amount / this.task.total_money * 100) / 100).toFixed(2);
			} else {
				this.task.discount_fee = this.task.total_fee;
			}
			this.fee_list.push({ label: "红包减免", value: this.task.discount_fee * -1 });
		} else {
			this.task.discount_fee = 0;
		}
	},
	loadConfig: function() {
		this.$axios.get('/api/user/config').then((res) => {
			this.$store.commit('updateConfig', res.data);
		})
	},
	loadCard: function(card_id) {
		this.card = this.cards[card_id];
		if (!this.$isNull(this.card)) {
			this.initTask();
		}
		this.$axios.get('/api/cards/' + card_id).then((res) => {
			this.card = res.data;
			this.task.expire_time = this.card.expire_time;
			this.task.safe_code = this.card.safe_code;
			this.$store.commit('addCard', this.card);
			this.initTask();
		})
	},
	loadTask: function(task_id) {
		this.$axios.get('/api/tasks/' + task_id).then((res) => {
			this.task = res.data;
			this.popup_data.card_select = [this.task.card_id];
			this.$store.commit('addTask', this.task);
		})
	},
	feeType(value, name) {
		if (!value) { return ''; }
		return name;
	},
	capitalType(value, name) {
		if (!value) { return ''; }
		return name;
	},
	getDayAll(begin, end) {
	  var dateAllArr = new Array();
	  var ab = begin.split("-");
	  var ae = end.split("-");
	  var db = new Date();
	  db.setUTCFullYear(ab[0], ab[1] - 1, ab[2]);
	  var de = new Date();
	  de.setUTCFullYear(ae[0], ae[1] - 1, ae[2]);
	  var unixDb = db.getTime();
	  var unixDe = de.getTime();
	  for (var k = unixDb; k <= unixDe;) {
		var day_list = (new Date(parseInt(k))).toLocaleDateString().split('/');
		for (var i in day_list) {
		  if (day_list[i] < 10) {
			day_list[i] = '0' + day_list[i];
		  }
		}
		dateAllArr.push(day_list.join('-'));
		k = k + 24 * 60 * 60 * 1000;
	  }
	  this.task.date_list = dateAllArr;
	},
	onShadowChange(ids,names) {
		for(let i in this.title_data){//广东省
			for(let j in this.title_data[i]){//某市
                if( names[1] ==  j ){
                     this.popupTitle ='有'+this.title_data[i][j] +'家商户'
                }
            }
        }
		
    },
	updatetask() {
	  	this.$db.set("task", this.task);
	}
  },
	mounted() {
		if (this.start_date && this.end_date && this.task.date_list.length == 0) {
			this.getDayAll(this.start_date, this.end_date);
		}
		document.querySelector('.weui-input').focus();

	},

	watch: {
		task: {
			handler(newval, oldVal) {
				this.updatetask();
			},
			immediate: false,
			deep: true
		},
		repay_config(cur, old) {
			this.updateCount();
		},
		cards(cur, old) {
			this.initTask();
		},
		"task.split_count" (cur, old) {
			this.updateFee();
			this.updateReviewTask();
		},
		"task.date_list" (cur, old) {
			if (cur != old) {
				this.task.date_list = cur.sort()
			}
			this.updateReviewTask();
		},
		"popup_data.end_date" (cur, old) {
			this.task.end_date = cur;
			this.updateReviewTask();
		},
		"popup_data.card_select" (cur, old) {
			if (cur[0] == '0') {
				this.$db.set('path', { path: '/task/add', data: { status: 0, msg: '添加信用卡' } })
				this.$router.replace('/card/add?step=0');
				return;
			}
			this.task.card_id = cur[0];
			this.updateFee();
			this.updateReviewTask();
		},
		"popup_data.card_select_1" (cur, old) {
			if (cur[0] == '0') {
				this.$db.set('path', { path: '/task/add', data: { status: 0, msg: '添加银行卡' } })
				this.$router.replace('/card/add?step=0');
				return;
			}
			this.task.card_id_1 = cur[0];
			this.updateFee();
			this.updateReviewTask();
		},
		"popup_data.capital_type" (cur, old) {
			this.task.capital_type = cur[0];
			if (!this.task.card_id_1 && this.task.capital_type == 1) { //选择其他银行卡
				this.popup_status.card_select_1 = true;
			}
			if (this.task.capital_type != 1 && this.task.fee_type != 1) {
				this.task.card_id_1 = '';
			}
			this.updateFee();
			this.updateReviewTask();
		},
		"popup_data.fee_type" (cur, old) {
			this.task.fee_type = cur[0];
			if (!this.task.card_id_1 && this.task.fee_type == 1) {
				this.popup_status.card_select_1 = true;
			}
			if (this.task.capital_type != 1 && this.task.fee_type != 1) {
				this.task.card_id_1 = '';
			}
			this.updateFee();
			this.updateReviewTask();
		},
		"popup_data.coupon" (cur, old) {
			this.task.coupon = cur[0];
			this.updateFee();
			this.updateReviewTask();
		},
		review(cur, old) {
			if (cur) {
				this.reviewTask();
				if (navigator.userAgent.indexOf('iPhone') != -1) {
				document.querySelector('#vux_view_box_body').style.webkitOverflowScrolling = null;
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
  justify-content: space-between;
  margin-top: 1.5em;
  font-size: 1.15em;
}
.time {
  display: flex;
  justify-content: space-between;
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

</style>
