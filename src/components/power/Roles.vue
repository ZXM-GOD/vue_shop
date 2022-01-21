  <template>
  <div>
    <!-- 面包屑导航区域 -->
    <el-breadcrumb separator-class="el-icon-arrow-right">
      <el-breadcrumb-item :to="{ path: '/home' }">首页</el-breadcrumb-item>
      <el-breadcrumb-item>权限管理</el-breadcrumb-item>
      <el-breadcrumb-item>角色列表</el-breadcrumb-item>
    </el-breadcrumb>
    <!-- 卡片视图 -->
    <el-card>
      <!-- 添加角色按钮区域 -->
      <el-row>
        <el-col>
          <el-button type="primary" @click="addRoles">添加角色</el-button>
        </el-col>
      </el-row>
      <!-- 角色列表区域 -->
      <el-table :data="rolesList" border stripe>
        <!-- 展开列 -->
        <el-table-column type="expand">
          <template slot-scope="scope">
            <el-row
              v-for="(item1, i1) in scope.row.children"
              :key="item1.id"
              :class="['bdbottom', i1 === 0 ? 'bdtop' : '', 'vcenter']"
            >
              <!-- 渲染一级权限 -->
              <el-col :span="5">
                <el-tag
                  closable
                  @close="removeRightById(scope.row, item1.id)"
                  >{{ item1.authName }}</el-tag
                >
                <i class="el-icon-caret-right"></i>
              </el-col>
              <!-- 渲染二级和三级权限 -->
              <el-col :span="19">
                <!-- 渲染二级权限 -->
                <el-row
                  v-for="(item2, i2) in item1.children"
                  :key="item2.id"
                  :class="[i2 === 1 ? 'bdtop' : '', 'vcenter']"
                >
                  <el-col :span="6">
                    <el-tag
                      type="success"
                      closable
                      @close="removeRightById(scope.row, item2.id)"
                      >{{ item2.authName }}</el-tag
                    >
                    <i class="el-icon-caret-right"></i>
                  </el-col>
                  <el-col :span="18">
                    <!-- 渲染三级权限 -->
                    <el-tag
                      type="warning"
                      v-for="(item3, i3) in item2.children"
                      :key="item3.id"
                      :class="[i3 === 2 ? 'bdtop' : '']"
                      closable
                      @close="removeRightById(scope.row, item3.id)"
                    >
                      {{ item3.authName }}
                    </el-tag>
                  </el-col>
                </el-row>
              </el-col>
            </el-row>
          </template>
        </el-table-column>
        <!-- 所引列 -->
        <el-table-column type="index"></el-table-column>
        <el-table-column label="角色名称" prop="roleName"></el-table-column>
        <el-table-column label="角色描述" prop="roleDesc"></el-table-column>
        <el-table-column label="操作">
          <template slot-scope="scope" width="300px">
            <el-button
              size="mini"
              type="primary"
              icon="el-icon-search"
              @click="editUserAttributes(scope.row.id)"
              >编辑</el-button
            >
            <el-button
              size="mini"
              type="danger"
              icon="el-icon-delete"
              @click="removeById(scope.row.id)"
              >删除</el-button
            >
            <el-button
              size="mini"
              type="warning"
              icon="el-icon-setting"
              @click="showSetRightDialog(scope.row)"
              >分配权限</el-button
            >
          </template>
        </el-table-column>
      </el-table>
    </el-card>
    <!-- 分配权限 -->
    <el-dialog
      title="分配权限"
      :visible.sync="setRightDialogVisible"
      width="50%"
      @close="setRightDialogClosed"
    >
      <!-- 树形控件 -->
      <el-tree
        :data="rightList"
        :props="treeProps"
        show-checkbox
        node-key="id"
        default-expand-all
        :default-checked-keys="defKeys"
        ref="treeRef"
      ></el-tree>
      <span slot="footer" class="dialog-footer">
        <el-button @click="setRightDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="allotRights">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 添加用户 -->
    <el-dialog
      title="添加角色"
      :visible.sync="addRolesDialogVisible"
      width="50%"
      @close="closeRoles"
    >
      <el-form
        :model="addRuleForm"
        :rules="add_set_Rules"
        ref="addRuleForm"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="addRuleForm.roleName"></el-input>
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDesc">
          <el-input v-model="addRuleForm.roleDesc"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="addRolesDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="addRolesUser">确 定</el-button>
      </span>
    </el-dialog>

    <!-- 修改用户信息 -->
    <el-dialog
      title="修改角色描述"
      :visible.sync="setUserDialogVisible"
      width="50%"
    >
      <el-form
        :model="setFrom"
        :rules="add_set_Rules"
        ref="setUserRuleRef"
        label-width="100px"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input v-model="setFrom.roleName"></el-input>
        </el-form-item>
        <el-form-item label="角色描述" prop="roleDesc">
          <el-input v-model="setFrom.roleDesc"></el-input>
        </el-form-item>
      </el-form>
      <span slot="footer">
        <el-button @click="setUserDialogVisible = false">取 消</el-button>
        <el-button type="primary" @click="setUser">确 定</el-button>
      </span>
    </el-dialog>
  </div>
</template>
  
  <script>
export default {
  data() {
    return {
      // 所有角色数据
      rolesList: [],
      // 控制分配权限对话框
      setRightDialogVisible: false,
      // 所有权限数据
      rightList: [],
      // 树形控件属性绑定对象
      treeProps: {
        label: "authName",
        children: "children",
      },
      // 默认选中的节点的id数组
      defKeys: [],
      // 当前即将分配权限的id
      roleId: "",
      // 添加角色对话框开关
      addRolesDialogVisible: false,
      // 新增用户表单对象
      addRuleForm: {
        roleName: "",
        roleDesc: "",
      },
      // 添加用户表单验证对象
      add_set_Rules: {
        roleName: [
          { required: true, message: "请输入用户角色名", trigger: "blur" },
        ],
        roleDesc: [
          { required: true, message: "请输入用户描述", trigger: "blur" },
        ],
      },
      // 修改用户信息对话框开关
      setUserDialogVisible: false,
      // 修改用户表单对象
      setUserRuleForm: {
        roleName: "",
        roleDesc: "",
      },
      // 获取要修改用户表单对象
      setFrom: {},
    };
  },
  created() {
    this.getRolesList();
  },
  methods: {
    async getRolesList() {
      const { data: res } = await this.$http.get("roles");
      if (res.meta.status !== 200) {
        this.$message.error("获取数据失败");
      }
      this.rolesList = res.data;
    },
    // 根据id删除对应权限
    async removeRightById(role, rightId) {
      // 弹框提示用户是否删除
      const confirmResult = await this.$confirm(
        "此操作将永久删除该权限, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).catch((err) => err);
      if (confirmResult !== "confirm") {
        return this.$message.info("已取消");
      }
      const { data: res } = await this.$http.delete(
        `roles/${role.id}/rights/${rightId}`
      );
      if (res.meta.status !== 200) {
        return this.$message.error("删除权限失败");
      }
      // this.getRolesList();
      role.children = res.data;
    },
    // 展示分配权限对话框
    async showSetRightDialog(role) {
      this.roleId = role.id;
      // 获取所有权限数据
      const { data: res } = await this.$http.get("rights/tree");
      if (res.meta.status !== 200) {
        return this.$message.error("获取权限数据失败");
      }
      // 所有权限数据
      this.rightList = res.data;
      // 递归获取三级节点的id
      this.getLeafKeys(role, this.defKeys);
      this.setRightDialogVisible = true;
    },
    // 通过递归形式,获取角色下所有三级权限的id,保存到defkeys中
    getLeafKeys(node, arr) {
      if (!node.children) {
        return arr.push(node.id);
      }
      node.children.forEach((item) => {
        this.getLeafKeys(item, arr);
      });
    },
    // 监听分配权限对话框的关闭
    setRightDialogClosed() {
      this.defKeys = [];
    },
    // 为角色分配权限
    async allotRights() {
      const keys = [
        ...this.$refs.treeRef.getCheckedKeys(),
        ...this.$refs.treeRef.getHalfCheckedKeys(),
      ];
      const idStr = keys.join(",");
      const { data: res } = await this.$http.post(
        `roles/${this.roleId}/rights`,
        {
          rids: idStr,
        }
      );
      if (res.meta.status !== 200) {
        return this.$$message.error("分配权限失败!");
      }
      this.$message.success("分配权限成功!");
      this.getRolesList();
      this.setRightDialogVisible = false;
    },
    // 删除角色信息
    async removeById(id) {
      const confirmResult = await this.$confirm(
        "此操作将永久删除该文件, 是否继续?",
        "提示",
        {
          confirmButtonText: "确定",
          cancelButtonText: "取消",
          type: "warning",
        }
      ).catch((err) => err);
      // 取消删除
      if (confirmResult !== "confirm") {
        return this.$message.info("已取消删除！");
      }
      // 确认删除
      const { data: res } = await this.$http.delete(`roles/${id}`);

      if (res.meta.status !== 200) {
        return this.$message.error("删除角色失败！");
      }
      this.$message.success("删除角色成功！");
      this.getRolesList();
    },
    // 清空表单内容
    closeRoles() {
      this.addRuleForm.roleName = "";
      this.addRuleForm.roleDesc = "";
    },
    // 添加角色
    addRoles() {
      this.addRolesDialogVisible = true;
    },
    // 确认添加
    addRolesUser() {
      this.$refs.addRuleForm.validate(async (valid) => {
        if (!valid) {
          return;
        }
        const { data: res } = await this.$http.post("roles", this.addRuleForm);
        if (res.meta.status !== 201) {
          return this.$message.error("新增用户名失败！");
        }
        this.addRolesDialogVisible = false;
        this.getRolesList();
        this.$message.success("新增用户成功！");
      });
    },

    // 获取编辑角色信息
    async editUserAttributes(_id) {
      const { data: res } = await this.$http.get(`roles/${_id}`);
      if (res.meta.status !== 200) {
        return this.$message.error("获取角色数据失败！");
      }
      this.setFrom = res.data;
      this.setUserDialogVisible = true;
    },
    // 提交修改用户信息
    setUser() {
      this.$refs.setUserRuleRef.validate(async (value) => {
        if (!value) {
          return;
        }
        const { data: res } = await this.$http.put(
          `roles/${this.setFrom.roleId}`,
          {
            roleName: this.setFrom.roleName,
            roleDesc: this.setFrom.roleDesc,
          }
        );
        if (res.meta.status !== 200) {
          return this.$message.error("修改角色信息失败！");
        }
        this.setUserDialogVisible = false;
        this.getRolesList();
        this.$message.success("修改角色信息成功！");
      });
    },
  },
};
</script>
  
  <style lang='scss' scoped>
.el-tag {
  margin: 7px;
}
.bdtop {
  border-top: 1px solid #eee;
}
.bdbottom {
  border-top: 1px solid #eee;
}
.vcenter {
  display: flex;
  align-items: center;
}
</style>