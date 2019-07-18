import Vue from 'vue'
import Router from 'vue-router'

Vue.use(Router)
export default new Router({
  mode: window.navigator.standalone ? 'hash' : 'history',
  routes: [{
      path: '',
      meta: { requireAuth: false, hideTitle: true, showBar: true },
      component: resolve => require(['../page/home'], resolve)
    }, {
      path: '/login',
      meta: { requireAuth: false, hideTitle: false, showBar: false },
      component: resolve => require(['../page/login'], resolve)
    },
    {
      path: '/faq',
      meta: { requireAuth: false, showBar: false, backUrl: '/kefu' },
      component: resolve => require(['../page/faq'], resolve)
    },
    {
      path: '/user/:pass_type',
      meta: { requireAuth: true, showBar: false, backUrl: '/' },
      component: resolve => require(['../page/user_edit'], resolve)
    }, {
      path: '/card/add',
      meta: { requireAuth: false, showBar: false, backUrl: '' },
      component: resolve => require(['../page/card_add'], resolve)
    }, {
      path: '/card/edit',
      meta: { requireAuth: false, showBar: false, backUrl: '' },
      component: resolve => require(['../page/card_edit'], resolve)
    }, {
      path: '/card/:id',
      meta: { requireAuth: true, showBar: false, showBtn:true, backUrl: '' },
      component: resolve => require(['../page/card_view'], resolve)
    }, {
      path: '/card',
      meta: { requireAuth: false, showBar: false, backUrl: '/' },
      component: resolve => require(['../page/card'], resolve)
    }, {
      path: '/task/add',
      meta: { requireAuth: false, showBar: false, showBtn:true, backUrl: '/task' },
      component: resolve => require(['../page/task_add'], resolve)

    }, {
      path: '/coupon',
      meta: { requireAuth: false, showBar: false, backUrl: '/me' },
      component: resolve => require(['../page/coupon'], resolve)
    }, {
      path: '/task/edit/:id',
      meta: { requireAuth: true, showBar: false, backUrl: '/task' },
      component: resolve => require(['../page/task_add'], resolve)
    }, {
      path: '/task/:id',
      meta: { requireAuth: true, showBar: false, showBtn:true, backUrl: '/task' },
      component: resolve => require(['../page/task_view'], resolve)
    }, 
    {
      path: '/invite/user',
      meta: { requireAuth: true, showBar: false, backUrl: '' },
      component: resolve => require(['../page/invite_user'], resolve)
    },{
      path: '/task',
      meta: { requireAuth: false, showBar: false, showBtn:true, backUrl: '/me' },
      component: resolve => require(['../page/task'], resolve)
    }, {
      path: '/trade/:id',
      meta: { requireAuth: true, showBar: false, backUrl: '/me' },
      component: resolve => require(['../page/trade_view'], resolve)
    }, {
      path: '/trade',
      meta: { requireAuth: true, showBar: false, backUrl: '' },
      component: resolve => require(['../page/trade'], resolve)
    }, {
      path: '/me',
      meta: { requireAuth: false, hideTitle: true, showBar: true },
      component: resolve => require(['../page/me'], resolve)
    }, {
      path: '/settings',
      meta: { requireAuth: true, showBar: false, backUrl: '/me' },
      component: resolve => require(['../page/settings'], resolve)
    }, {
      path: '/cash/:trade_type',
      meta: { requireAuth: false, showBar: false, backUrl: '' },
      component: resolve => require(['../page/cash'], resolve)
    }, {
      path: '/rank',
      meta: { requireAuth: false, showBar: false, backUrl: '/me' },
      component: resolve => require(['../page/rank'], resolve)
    }, {
      path: '/cash',
      meta: { requireAuth: true, showBar: false, backUrl: ''},
      component: resolve => require(['../page/cash'], resolve)
    }, {
      path: '/shop',
      meta: { requireAuth: true, showBar: false, backUrl: ''},
      component: resolve => require(['../page/shop'], resolve)
    }, {
      path: '/channel',
      meta: { requireAuth: true, showBar: false, backUrl: ''},
      component: resolve => require(['../page/channel'], resolve)
    }, {
      path: '/pay',
      meta: { requireAuth: true, showBar: false, backUrl: '' },
      component: resolve => require(['../page/pay'], resolve)
    }, {
      path: '/kefu',
      meta: { requireAuth: false, showBar: false, backUrl: '' },
      component: resolve => require(['../page/kefu'], resolve)
    }, {
      path: '/invite',
      meta: { requireAuth: false, showBar: true, hideTitle: true, backUrl: '' },
      component: resolve => require(['../page/invite'], resolve)
    }, {
      path: '/invite/share',
      meta: { requireAuth: false, hideTitle: false, showBar: false, backUrl: '' },
      component: resolve => require(['../page/share'], resolve)
    }
  ]
})
