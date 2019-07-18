<template>
  <div>
    <div class="kefu">
      <i class="icon icon-kefu"></i>
    </div>
    <group>
      <cell title="客服QQ" is-link @click.native="open('mqqwpa://im/chat?chat_type=wpa&uin=189369004&version=1&src_type=web&web_src=null','http://wpa.qq.com/msgrd?v=3&uin=189369004&site=qq&menu=yes')" value="189369004"><i slot="icon" class="icons icon icon-kefuQQ"></i></cell>
      <cell title="客服电话" is-link @click.native="open('tel://02087578965','tel://02087578965')" value="020-87578965"><i slot="icon" class="icons icon icon-kefudianhua"></i></cell>
      <cell title="常见问题" is-link link="/faq" value="疑难解答"><i slot="icon" class="icons icon icon-shuoming"></i></cell>
    </group>
  </div>
</template>
<script>
import { Group, Cell, Qrcode } from 'vux'
export default {
  name: 'kefu',
  data() {
    return {

    }
  },
  components: {
    Group,
    Cell,
    Qrcode
  },
  created() {
    this.$store.commit('updatePageTitle', '客服');
  },
  methods: {
    open(url, urlHttp) {
      if (window.navigator.userAgent.indexOf('MicroMessenger') != -1) {
        //  WeixinJSBridge&&WeixinJSBridge.invoke('launchApplication',{
        //           "schemeUrl":url
        //       },function(res){
        //           alert(res.err_msg);
        //        });
        window.open(urlHttp);
      } else {
        location.href = url;
      }

    }

  }
}

</script>
<style lang="less">
.kefu{
  text-align: center;
}
.kefu .icon{
  font-size: 5em;
}
</style>
