<template>
  <div>
    <div></div>
    <h4 style="text-align:center">我的收益</h4>
    <div style="width: 80%;margin: 3% 10%;">
      <grid>
        <grid-item  :label='this.invited_count'>
          <div style="text-align:center">成功邀请</div>
        </grid-item>
        <grid-item label="0.00">
          <div style="text-align:center">累计奖励</div>
        </grid-item>
      </grid>
    </div>
    <h4 style="text-align:center">活动规则</h4>
    <div>
      <div class="text">
        <p><span>1.成功邀请一位好友体验银掌通产品，您可获得现金奖励10元，同时好友将获得1000元免息金；</span></p>
        <p><span><br></span></p>
        <p><span>2.好友奖励逐步发放，好友完成注册并实名认证立即发放2元奖励，好友在平台交易金额达到3000元发放剩下的8元奖励（取现或还款交易累计超过3000元即可）；</span></p>
        <p><span><br></span></p>
        <p><span>3.奖励发放至钱包，可随时提现。</span></p>
      </div>
    </div>
    <confirm v-model="showQrcode" :show-cancel-button="false" title="分享二维码">
      <qrcode value="qrcode" type="img"></qrcode>
    </confirm>
    <div class="weui-tabbar" style="background-color: #FF9900;text-align: center;color:#FFF">
      <div style="margin: 10px;width: 100%;">
        <label @click="link()">立即邀请赚钱</label>
      </div>
    </div>
  </div>
</template>
<script>
import { Grid, GridItem,Qrcode,Confirm } from 'vux'
import { mapGetters, mapActions } from 'vuex'

export default {
  data() {
    return {
      invited_count:null,
      showQrcode:false,
    }
  },
  components: {
    Grid,
    GridItem,
    Confirm,
    Qrcode,
  },
  created() {
    if( this.$route.query.invited_count==undefined ){
      this.invited_count = this.$route.query.invited_count 
    }else{ this.invited_count= '0'};
    this.$store.commit('updatePageTitle', '邀请分享');
  },
  computed: {
    
  },
  methods: {
    ...mapActions(['']),
    link() {
      this.showQrcode = true;
    }
  }
}

</script>
<style>
.text {
  margin: auto 1em;
  font-size: 0.9em;
  line-height: 1.5em;
}

</style>
