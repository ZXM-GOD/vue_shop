<template>
  <div>
    <!-- 面包屑导航 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>商品管理</el-breadcrumb-item>
      <el-breadcrumb-item>商品分类</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片视图 -->
    <el-card>
      <el-row>
        <el-col>
          <el-button type="primary" @click="showAddCatDialog"
            >添加分类</el-button
          >
        </el-col>
      </el-row>
      <!-- 表格 -->
      <tree-table
        :expand-type="false"
        :data="cateList"
        :columns="columns"
        :selection-type="false"
        show-index
        index-text="#"
        border
        class="TreeTable"
      >
        <template slot="isok" slot-scope="scope">
          <i
            class="el-icon-success"
            style="color: lightgreen"
            v-if="scope.row.cat_deleted === false"
          ></i>
          <i class="el-icon-error" v-else style="color: green"></i>
        </template>
        <template slot="order" slot-scope="scope">
          <el-tag size="mini" v-if="scope.row.cat_level === 0">一级</el-tag>
          <el-tag
            size="mini"
            v-else-if="scope.row.cat_level === 1"
            type="success"
            >二级</el-tag
          >
          <el-tag size="mini" v-else type="warning">三级</el-tag>
        </template>
        <template slot="opt" slot-scope="scope">
          <el-button
            type="primary"
            icon="el-icon-edit"
            size="mini"
            @click="setCategory(scope.row.cat_id)"
            >编辑</el-button
          >
          <el-button
            type="danger"
            icon="el-icon-delete"
            size="mini"
            @click="deleteCategory(scope.row.cat_id)"
            >删除</el-button
          >
        </template>
      </tree-table>

      <!-- 分页 -->
      <el-pagination
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :current-page="querInfo.pagenum"
        :page-sizes="[5, 10, 15]"
        :page-size="querInfo.pagesize"
        layout="total, sizes, prev, pager, next, jumper"
        :total="total"
      >
      </el-pagination>
    </el-card>
    <!-- 添加对话框 -->
    <el-dialog
      title="添加分类"
      :visible.sync="addCateDialogVisible"
      width="50%"
      @close="addCateDialogClosed"
    >
      <el-form
        :model="addCateForm"
        :rules="addCateFormRules"
        ref="addCateFormRef"
        label-width="100px"
      >
        <el-form-item label="分类名称:" prop="cat_name">
          <el-input v-model="addCateForm.cat_name"></el-input>
        </el-form-item>
        <el-form-item label="父级分类:">
          <el-cascader
            v-model="selectedKeys"
            :options="parentCateList"
            :props="cascaderProps"
            @change="parentCateChanged"
            clearable
          ></el-cascader>
        </el-form-item>
      </el-form>
      <span slot="footer" class="dialog-footer">
        <el-button @click="addCateDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addCate">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 编辑分类对话框 -->
    <el-dialog
      title="编辑分类"
      :visible.sync="setCateDialogVisible"
      width="50%"
    >
      <el-form
        :model="cateRuleForm"
        :rules="cateRules"
        ref="cateRuleFormRes"
        label-width="100px"
      >
        <el-form-item label="分类名称" prop="cat_name">
          <el-input v-model="cateRuleForm.cat_name"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="setCateDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="setCateInfo">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>

<script>
export default {
  data() {
    return {
      cateList: [],

      total: 0,
      querInfo: {
        type: 3,
        // 当前页码
        pagenum: 1,
        // 每页显示条数
        pagesize: 5,
      },
      columns: [
        {
          label: "分类名称",
          prop: "cat_name",
        },
        {
          label: "是否有效",
          // 表示当前列定义为模板列
          type: "template",
          // 表示当前列使用的模板名称
          template: "isok",
        },
        {
          label: "排序",
          // 表示当前列定义为模板列
          type: "template",
          // 表示当前列使用的模板名称
          template: "order",
        },
        {
          label: "操作",
          // 表示当前列定义为模板列
          type: "template",
          // 表示当前列使用的模板名称
          template: "opt",
        },
      ],
      // 添加分类对话框的显示与隐藏
      addCateDialogVisible: false,
      // 添加分类 表单数据对象
      addCateForm: {
        cat_name: "",
        // 父级分类的id
        cat_pid: 0,
        // 分类的等级,默认是1级分类
        cat_level: 0,
      },
      // 添加分类的校验规则
      addCateFormRules: {
        cat_name: [
          { required: true, message: "请输入分类名称", trigger: "blur" },
        ],
      },
      // 父级分类
      parentCateList: [],
      // 级联选择器的配置对象
      cascaderProps: {
        expandTrigger: "hover",
        value: "cat_id",
        label: "cat_name",
        children: "children",
        checkStrictly: true,
      },
      // 选中的父级分类的id
      selectedKeys: [],
      // 编辑分类对话框显示隐藏
      setCateDialogVisible: false,
      // 提交分类表单数据
      cateRuleForm: {},
      //
      cateRules: {
        cat_name: [
          { required: true, message: "请输入分类名称", trigger: "blur" },
        ],
      },
    };
  },
  created() {
    this.getCateList();
  },
  methods: {
    // 获取商品数据
    async getCateList() {
      const { data: res } = await this.$http.get("categories", {
        params: this.querInfo,
      });
      if (res.meta.status !== 200) {
        return this.$message.error("获取数据失败!");
      }
      this.cateList = res.data.result;
      this.total = res.data.total;
    },
    // 监听pagesize的改变
    handleSizeChange(newSize) {
      this.querInfo.pagesize = newSize;
      this.getCateList();
    },
    // 监听pagenum的改变
    handleCurrentChange(newNum) {
      this.querInfo.pagenum = newNum;
      this.getCateList();
    },
    // 点击按钮,展示添加分类的对话框
    showAddCatDialog() {
      this.getParentCateList();
      this.addCateDialogVisible = true;
    },
    // 获取父级分类的数据
    async getParentCateList() {
      const { data: res } = await this.$http.get("categories", {
        params: { type: 2 },
      });
      if (res.meta.status !== 200) {
        return this.$message.error("获取数据失败");
      }
      this.parentCateList = res.data;
    },
    // 选择项发生变化触发
    parentCateChanged() {
      const keyLength = this.selectedKeys.length;
      if (keyLength > 0) {
        // 父级分类的id
        this.addCateForm.cat_pid = this.selectedKeys[keyLength - 1];
        this.addCateForm.cat_level = keyLength;
      } else {
        this.addCateForm.cat_pid = 0;
        this.addCateForm.cat_level = 0;
      }
    },
    // 确认添加
    addCate() {
      this.$refs.addCateFormRef.validate(async (valid) => {
        if (!valid) {
          return;
        }
        const { data: res } = await this.$http.post(
          "categories",
          this.addCateForm
        );
        if (res.meta.status !== 201) {
          return this.$message.error("添加分类失败!");
        }
        this.$message.success("添加分类成功!");
        this.getCateList();
        this.addCateDialogVisible = false;
      });
    },
    // 监听关闭对话框
    addCateDialogClosed() {
      this.$refs.addCateFormRef.resetFields();
      this.selectedKeys = [];
      this.addCateForm.cat_pid = 0;
      this.addCateForm.cat_level = 0;
    },
    // 获取编辑分类数据
    async setCategory(id) {
      const { data: res } = await this.$http.get(`categories/${id}`);
      if (res.meta.status !== 200) {
        return this.$message.error("获取分类数据失败！");
      }
      this.$message.success("获取分类数据成功！");
      this.cateRuleForm = res.data;
      this.setCateDialogVisible = true;
      console.log(this.cateRuleForm);
    },
    // 提交分类更改
    setCateInfo() {
      this.$refs.cateRuleFormRes.validate(async (value) => {
        if (!value) {
          return;
        }
        const { data: res } = await this.$http.put(
          `categories/${this.cateRuleForm.cat_id}`,
          this.cateRuleForm
        );
        if (res.meta.status !== 200) {
          return this.$message.error("更新数据失败！");
        }
        this.$message.success("更新数据成功！");
        this.setCateDialogVisible = false;
        this.getCateList();
      });
    },
    // 删除分类
    async deleteCategory(id) {
      const deleteCate = await this.$confirm(
        "此操作将永久删除该文件, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).catch((err) => err);
      if (deleteCate !== "confirm") {
        return this.$message.info("已取消删除！");
      }
      const { data: res } = await this.$http.delete(`categories/${id}`);
      if (res.meta.status !== 200) {
        return this.$message.error("删除分类失败！");
      }
      this.$message.success("删除分类成功！");
      this.querInfo.pagenum = 1;
      this.setCateDialogVisible = false;
      this.getCateList();
    },
  },
};
</script>

<style lang="scss" scoped>
.TreeTable {
  margin-top: 15px;
}
.el-cascader {
  width: 100%;
}
</style>