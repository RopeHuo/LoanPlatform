import Vue from 'vue'
import Vuex from 'vuex'
import axios from 'axios'
import db from '../db'
import { stat } from 'fs';

Vue.use(Vuex)
const $isNull = function(obj) {
  if (!obj) { return true; }
  return Object.keys(obj).length == 0;
}
export default new Vuex.Store({
	state:{
		user:{},
		config:{},
		token:'',
		total_page:null,
		cards:{},
		tasks:[],
		bank_list:{},
		trades:[],
		page_title:'',
		is_loading:false,
		btn_loading:false,
		address:[],
		page_count:{},
		coupons:[],
		task:{},
		invites:[],
		channels:[]
	},
	actions:{
		login({commit},user) {
			commit('LOGIN',user)
		},
		loadBankList({commit, state}) {
			if((!state.token || state.token=="null")&&!db.get('token')){
				return ;
			}
			axios.get('/api/banks?v='+(new Date()).getHours()).then((res) => {
				commit('updateBankList',res.data);
				if(res.data.length>0){
					store.dispatch('loadCards','is_bank_link');
				}
			})
		},
		loadCard({commit, state},card_id){  
			axios.get('/api/cards/' + card_id).then((res) => {
					store.commit('addCard',res.data);
			})
		},
		loadCards({commit,state}){
			if((!state.token || state.token=="null")&&!db.get('token')){
				// state.cards = {};
				return ;
			}
			if($isNull(state.bank_list)){
				store.dispatch('loadBankList');
				return;
			}
			axios.get('/api/cards').then((res)=>{
				var cards_data = res.data;
				if(cards_data.length>0){
					for(let i in cards_data){
						let card = cards_data[i];
						if(card.bank_key){
							let _bank_list = store.getters.bank_list;
							let bank = _bank_list[card.bank_key.toUpperCase()];
							if(bank){
								card['color'] = bank.color;
								card['bank_key'] = bank.bank_key;
								card['bank_name'] = bank.name;
								if(!card.name){
									card.name = `${bank.name}(${card.number.substr(-4)})`;
								}
							}
						}
					}
				}
				commit('updateCards',cards_data);       
			});
		},
		loadUser({ commit, state }, user) {
			if((!state.token || state.token=="null")&&!db.get('token')){
				return ;
			}
			axios.get('/api/users/0?v='+(new Date()).getHours()).then((res) => {
				commit('updateUser', res.data);
			})
		},
		loadTasks({ commit, state },filter){
			if((!state.token || state.token=="null")&&!db.get('token')){
				return ;
			}
			axios.get('/api/tasks', { params: filter }).then((res)=>{
					state.total_page = res.headers['x-total-page']; 
					if(filter.page > 1){
						commit('updateConcatTasks',res.data);
					}else {       
						commit('updateTasks',res.data);
					}
			})
	  },
		loadTask({ commit, state },item){
			if(!state.token || state.token=='null'){
				return ;
			}
			axios.get('/api/tasks'+item).then((res) => {
				commit('addTask', res.data);
			})
		},
		loadTrades({ commit, state },filter){
			if((!state.token || state.token=="null")&&!db.get('token')){
				return ;
			}
			axios.get('/api/trades', { params: filter }).then((res)=>{
					state.total_page = res.headers['x-total-page']; 
					if(filter.page > 1){
						commit('updateConcatTrades',res.data);
					}else {       
						commit('updateTrades',res.data);
					}
			})
		},
		loadInvites({ commit, state },filter){
			if((!state.token || state.token=='null') && !db.get('token')){
				return ;
			}
			axios.get('/api/user/invited',{ params: filter }).then((res)=>{  
				commit('updateInvites',res.data); 
				commit('updatePageCount', { key: 'invites',val: res.headers })
			});
		},
		loadCoupons({ commit, state },filter){
			if((!state.token || state.token=="null")&&!db.get('token')){
				return ;
			}
			axios.get('/api/coupons',{ params: filter }).then((res)=>{
				commit('updateCoupon', res.data);
				commit('updatePageCount', { key: 'coupons',val: res.headers })
			})
    	},
		loadConfig({ commit, state }){
			if((!state.token || state.token=="null")&&!db.get('token')){
				return ;
			}
			axios.get('/api/user/config').then((res) => {
				commit('updateConfig',res.data);
			})
		}
	},
	getters: {
		is_loading(state){
		  return state.is_loading || false;
		},
		page_title(state){
		  return state.page_title || '';
		},
		total_page(state){
		  return state.total_page || 0;
		},
		btn_loading(state){
		  return state.btn_loading || false;
		},
		bank_list(state){
			if($isNull(state.bank_list) && !$isNull(db.get('bank_list'))){
				store.dispatch('loadBankList');
				state.bank_list = db.get('bank_list')||{};
			}
		  return state.bank_list || db.get('bank_list') || {};
		},
		coupons(state){
			if(state.coupons.length==0 && db.get('coupons')){
				state.coupons = db.get('coupons')||{};
			}
			return state.coupons || db.get('coupons') || [];
		},
		channels(state){
			if(state.channels.length==0 && db.get('channels')){
				state.channels = db.get('channels')||[];
			}
			return state.channels||[];
		},
		address(state) {
			if(state.address.length==0 && db.get('address')){
				state.address = db.get('address')
			}else if(state.address.length==0 && db.get('weixin_user')){
				if(db.get('weixin_user')['province'] && db.get('weixin_user')['city']){
					state.address = [db.get('weixin_user')['province'],db.get('weixin_user')['city']];
				}
			}
		  return state.address || db.get('address') || [];
		},
		user(state) {
			if($isNull(state.user) && !$isNull(db.get('user'))){
				state.user = db.get('user')||{};
				store.dispatch('loadUser');
			}
			if($isNull(state.user) || !state.user){
				return {money:0,locked_money:0,nickname:'朋友'};
			}else{
				return state.user || db.get('user')
			}
		},
		token(state) {
			if(!state.token && db.get('token')){
				state.token = db.get('token')||'';
			}
		  	return state.token || '';
		},
		cards(state) {
			if($isNull(state.cards)){
				state.cards = db.get('cards')||{};
				//if($isNull(state.cards)){
				store.dispatch('loadCards');
				//}
			}
		  	return state.cards || {};
		},
		tasks(state) {
			if((state.tasks.length==0 && db.get('tasks'))||!db.get('tasks')){
				state.tasks = db.get('tasks')||{};
				//store.dispatch('loadTasks',{page:1});
			}
		  return state.tasks || [];
		},
		task(state){
			return state.task || {} 
		},
		invites(state) {
			if((state.invites.length==0 && db.get('invites'))||!db.get('invites')){
				state.invites = db.get('invites')||{};
				store.dispatch('loadInvites');
			}
		  return state.invites || [];
		},
		trades(state) {
			if((state.trades.length==0 && db.get('trades'))||!db.get('trades')){
				state.trades = db.get('trades')||{};
				store.dispatch('loadTrades');
			}
		  return state.trades || [];
		},
		config(state) {
			if($isNull(state.config) && !$isNull(db.get('config'))){
				state.config = db.get('config')||{};
			}
		  return state.config || {};
		}
	},
	mutations:{
		updateBankList(state,bank_list) {
			let banks = {};
			if(bank_list && bank_list.length>0){
				for(let i in bank_list){
					let item = bank_list[i];
					state.bank_list[item.bank_key] = item;
				}
			}
		  db.set('bank_list', state.bank_list);
		},
		addBankList(state,bank){
			if(!$isNull(bank)){
				bank.name = bank.bank_name;
				state.bank_list[bank.bank_key] = bank;
			}
			db.set('bank_list', state.bank_list);
		},
		updateAddress(state,address) {
		  state.address = address;
		  db.set('address', address);
		},
		updateBtnLoading(state,btn_loading) {
		  state.btn_loading = btn_loading;
		},
		updateUser(state,user) {
		  state.user = user;
			db.set('user', user);
		},
		updateCoupon(state,coupons) {
		  state.coupons = coupons;
		  db.set('coupons', coupons);
		},
		updateChannels(state,channels) {
		  state.channels = channels;
		  db.set('channels', channels);
		},
		updateConfig(state,config) {
			state.config = config;
		  	db.set('config', config);
		},
		updateToken(state, token) {
		  state.token = token;
		  db.set('token', token);
		},
		updateLoadingStatus(state, isLoading) {
		  state.is_loading = isLoading;
		},
		updateConcatTasks(state, tasks) {
		  state.tasks = state.tasks.concat(tasks);
		},
		updateConcatInvites(state, trades) {
		  state.invites = state.invites.concat(invites);
		},
		updateConcatTrades(state, trades) {
		  state.trades = state.trades.concat(trades);
		},
		updatePageTitle(state, title) {
		  state.page_title = title;
		  document.title = title;
		},
		setToken(state, token) {
		  state.token = token;
		  db.set('token',token)
		},
		updateCards(state, cards_list){ //
		  if(cards_list.length!==0){
				state.cards = {};
				for(let i in cards_list){
					let card = cards_list[i];
					state.cards[card.id] = card;
				}
		  }else{
				db.remove('cards');
			}
			db.set('cards', state.cards); 
		},
		addCard(state,card){
		  if(!$isNull(card) && card.id){
				let _bank_list = store.getters.bank_list;
				let bank = _bank_list[card.bank_key.toUpperCase()];
				if(bank){
					card['color'] = bank.color;
					card['bank_key'] = bank.bank_key;
					card['bank_name'] = bank.name;
					if(!card.name){
						card.name = `${bank.name}(${card.number.substr(-4)})`;
					}
				}
				state.cards[card.id] = card; 
		  }
			db.set('cards', state.cards); 
		},
		removeCard(state,card_id){
			delete state.cards[card_id];
			state.cards[card_id] = Object.assign({}, state.cards[card_id]);
			db.set('cards', state.cards);
		},
		removeUser(state){
			state.user = {};
			db.remove('user');
		},
		removeCoupons(state){
			state.coupons = [];
			db.remove('coupons');
		},
		removeToken(state){
			state.token = null;
			db.remove('token');
		},
		removeTasks(state){
			state.tasks = [];
			db.remove('tasks');
		},
		removeTrades(state){
			state.trades =[];
			db.remove('trades');
		},
		removeCards(state){
			state.cards = {};
			db.remove('cards');
		},
		updateTasks(state,tasks){
			state.tasks = [];
			state.tasks = tasks;
			db.set('tasks', state.tasks);
		},
		clearStore(state){	//清除缓存
			state.config = {};
			state.cards = {};
			state.tasks = [];
			state.bank_list = {};
			state.trades = [];
			state.page_title = '';
			state.is_loading = false;
			state.btn_loading = false;
			state.page_count = {};
			state.coupons = [];
			try{
				db.remove('config');
				db.remove('cards');
				db.remove('tasks');
				db.remove('trades');
				db.remove('coupons');
				db.remove('path');
			}catch(e){}
			var mydate = new Date();  
			const time = (mydate.getMonth() + 1) + '-' + mydate.getDate() + ' ' + mydate.getHours() + ':' + mydate.getMinutes();
			db.set('clear_time',time);
		},
		addTask(state,task){
		  if(task && task.id){
				if(state.tasks.length==0){state.tasks=[];}
				for(let i in state.tasks){
					let _task = state.tasks[i];
					if(_task.id == task.id){
						state.tasks[i] = task;
						break;
					}
				}
			}
			db.set('tasks', state.tasks);
		},
		removeTask(state,task_id){
			delete state.tasks[task_id];
			db.set('tasks', state.tasks);
		},
		updateTrades(state,trades){
			state.trades = trades;
			db.set('trades', state.trades);
		},
		updateInvites(state,invites){
			  if(invites.length!==0){
				state.invites = invites;   
			}
			db.set('invites', state.invites);
		},
		addTrade(state,trade){
		  state.trades.push(trade);
		},
    updatePageCount(state, page_count) {
      var tmp = {};
      tmp[page_count.key] = { page: parseInt(page_count.val['x-page-num']), total_page: parseInt(page_count.val['x-total-page']) }
      if (page_count.val['x-total-count']) {
        tmp[page_count.key]['total_count'] = page_count.val['x-total-count'];
        tmp[page_count.key]['total_amount'] = page_count.val['x-total-amount'];
        tmp[page_count.key]['total_fee'] = page_count.val['x-total-fee'];
      }
      state.page_count = Object.assign({}, state.page_count, tmp);
    },
    removeTrade(state, trade_id) {
      for (var _index in state.trades) {
        if (state.trades[_index].id == trade_id) {
          state.trades.splice(_index, 1);
          break;
        }
      }

    }
  }
})
