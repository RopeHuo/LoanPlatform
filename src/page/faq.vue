<template>
    <div calss="faq">
        <div>
            <group  v-for="(item,index) in faq" :key="index">
                <cell :title="item.title" is-link :arrow-direction="item.is_show?'up':'down'" @click.native="show(index)"></cell>
                <cell-form-preview v-if="item.is_show" :border-intent="false"  :list="item.conter"></cell-form-preview>
            </group>
        </div>
    </div>
</template>

<script>
import {Group,CellFormPreview,Cell} from 'vux'
import { mapGetters, mapActions } from 'vuex'

export default {
  	name: 'faq',
    components: {
      Group,CellFormPreview,Cell
    },
    data(){
      return {
          faq:[],
      }
    },
    computed:{
      ...mapGetters(['user']),
     
    },
  	created(){
        this.$store.commit('updatePageTitle','常见问题');
        this.loadFaq();
  	},
    methods:{
       show(index){
          let _faq = this.faq;
          _faq[index].is_show = !_faq[index].is_show;
          this.faq = Object.assign({},_faq);
      },
      loadFaq(){
        this.$axios.get('/static/faq.json').then((res) => {
          this.faq = res.data;
        })
      }
    },
    watch:{
    }
}

</script>

<style lang="less">

</style>