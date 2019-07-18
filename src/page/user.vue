<template>
  <div>
    <header class="bar bar-nav">
      <router-link class="button button-link button-nav pull-left" to="/" v-if="!user_selected">返回</router-link>
      <a class="button button-link button-nav pull-left" @click="user_selected=''" v-if="user_selected">返回</a>
      <h1 class="title">用户管理</h1>
    </header>
    <div class="content native-scroll">
      <div v-if="!user_selected" class="list-block media-list">
        <ul v-for="item in users">
          <li>
            <router-link class="item-content item-link" @click="editUser(item)">
              <div class="item-media"></div>
              <div class="item-inner">
                <div class="item-title">{{item.username}}</div>
                <div class="item-subtitle">有效期：{{item.expire_time?item.expire_time:'永久'}}</div>
              </div>
            </router-link>
          </li>
        </ul>
        <div class="content-block">
          <input type="button" class="button button-big button-fill button-success" value="新增用户" @click="newUser" />
        </div>
      </div>
      <div v-if="user_selected" class="list-block">
        <ul>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">登录名称</div>
              <div class="item-input">
                <input type="text" v-model="user_selected.username" v-bind:readonly="user_selected.id" />
              </div>
            </div>
          </li>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">登录密码</div>
              <div class="item-input">
                <input type="password" v-model="user_selected.password" placeholder="不修改请留空" />
              </div>
            </div>
          </li>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">区服务器</div>
              <div class="item-input">
                <input type="text" v-model="user_selected.endpoint" />
              </div>
            </div>
          </li>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">云盘名称</div>
              <div class="item-input">
                <input type="text" v-model="user_selected.bucket_name" />
              </div>
            </div>
          </li>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">授权ID</div>
              <div class="item-input">
                <input type="text" v-model="user_selected.access_id" />
              </div>
            </div>
          </li>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">授权KEY</div>
              <div class="item-input">
                <input type="text" v-model="user_selected.access_key" />
              </div>
            </div>
          </li>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">根目录</div>
              <div class="item-input">
                <input type="text" v-model="user_selected.root_folder" />
              </div>
            </div>
          </li>
          <li class="item-content">
            <div class="item-inner">
              <div class="item-title label">有效期</div>
              <div class="item-input">
                <input type="text" v-model="user_selected.expire_time" />
              </div>
            </div>
          </li>
        </ul>
        <div class="content-block">
          <input type="button" class="button button-big button-fill button-success" value="保存" @click="saveUser" />
        </div>
      </div>
    </div>
  </div>
</template>
<script>
import { mapGetters, mapActions } from 'vuex'
import axios from 'axios'

export default {
  name: 'user',
  data() {
    return {
      users: {},
      user_selected: null,
      loading: false,
      error: ''
    }
  },
  computed: {
    ...mapGetters(['user']),
  },
  created() {
    if (this.$isNull(this.user)) {
      this.$router.push('/login');
      return;
    } else if (this.user.username != 'root') {
      this.$router.push({ name: 'home' });
      return;
    }
    this.loadUsers();
  },
  methods: {
    loadUsers() {
      this.error = '';
      axios({ url: '/api/user', method: 'get', auth: { 'token': this.user.token } }).then((res) => {
        this.loading = false;
        this.users = res.data;
      });
    },
    editUser(user) {
      axios({ url: '/api/user/' + user.id, method: 'get', data: this.user_selected, auth: { 'token': this.user.token } }).then((res) => {
        res = res.data;
        this.loading = false;
        user = res.data;
        this.user_selected = user;
      });
    },
    newUser(user) {
      this.user_selected = { username: '', password: '', endpoint: '', access_id: '', access_key: '', root_folder: '/', bucket_name: '' };
    },
    saveUser() {
      this.error = '';
      axios({ url: '/user', method: 'post', data: this.user_selected, auth: { 'token': this.user.token } }).then((res) => {
        this.loading = false;
        this.user_selected = null;
      });
    }
  }
}

</script>
<style lang="less">


</style>
