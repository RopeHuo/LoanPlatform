<template>
    <group>
        <cell title="官网" value="0" is-link link=""></cell>
        <cell title="客服热线" value="0" is-link link=""></cell>
        <cell title="微信公众号" is-link link="/invite"></cell>
        <cell title="新浪微圾" is-link link=""></cell>
    </group>
</template>
<script>
import {
    Cell,
    Group
} from 'vux'

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
    created() {

    },
    methods: {

    }
}
</script>
<style lang="less">
</style>
