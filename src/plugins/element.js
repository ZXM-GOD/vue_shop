import Vue from 'vue'
import {
  Button,
  Form,
  FormItem,
  Input,
  Message
} from 'element-ui'
// 导入弹框

Vue.prototype.$message = Message

Vue.use(Button)
Vue.use(FormItem)
Vue.use(Form)
Vue.use(Input)
