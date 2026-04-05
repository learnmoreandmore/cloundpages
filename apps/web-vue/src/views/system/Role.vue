<template>
  <div class="role-container">
    <div class="role-header">
      <h2>角色管理</h2>
      <el-button type="primary" icon="Plus" @click="handleAddRole">新增角色</el-button>
    </div>

    <el-card shadow="hover" class="role-card">
      <!-- 搜索筛选 -->
      <div class="role-search">
        <el-input
          v-model="searchKey"
          placeholder="请输入角色名称搜索"
          prefix-icon="Search"
          class="search-input"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button type="text" @click="resetSearch">重置</el-button>
      </div>

      <!-- 角色表格 -->
      <el-table :data="filteredRoleList" border stripe class="role-table">
        <el-table-column label="序号" type="index" width="80" />
        <el-table-column label="角色名称" prop="roleName" width="180" />
        <el-table-column label="角色描述" prop="description" />
        <el-table-column label="权限范围" prop="permissionScope" width="160">
          <template #default="scope">
            <el-tag type="primary" v-if="scope.row.permissionScope === 'all'">全部权限</el-tag>
            <el-tag type="success" v-else-if="scope.row.permissionScope === 'custom'">自定义权限</el-tag>
            <el-tag type="info" v-else>只读权限</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="状态" prop="status" width="120">
          <template #default="scope">
            <el-switch
              v-model="scope.row.status"
              active-value="1"
              inactive-value="0"
              @change="handleStatusChange(scope.row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="240" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              icon="Edit"
              class="edit-btn"
              @click="handleEditRole(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              icon="Lock"
              class="permission-btn"
              @click="handleSetPermission(scope.row)"
            >
              权限设置
            </el-button>
            <el-button
              type="text"
              icon="Delete"
              class="delete-btn"
              @click="handleDeleteRole(scope.row.id)"
              v-if="scope.row.roleName !== '超级管理员'"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="role-pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          :total="roleList.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 新增/编辑角色弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="roleFormRef"
        :model="roleForm"
        :rules="roleRules"
        label-width="120px"
        class="role-form"
      >
        <el-form-item label="角色名称" prop="roleName">
          <el-input
            v-model="roleForm.roleName"
            placeholder="请输入角色名称"
            :disabled="currentRoleId && roleForm.roleName === '超级管理员'"
          />
        </el-form-item>
        <el-form-item label="角色描述" prop="description">
          <el-input
            v-model="roleForm.description"
            placeholder="请输入角色描述"
            type="textarea"
            rows="3"
          />
        </el-form-item>
        <el-form-item label="权限范围" prop="permissionScope">
          <el-select
            v-model="roleForm.permissionScope"
            placeholder="请选择权限范围"
          >
            <el-option label="全部权限" value="all" />
            <el-option label="自定义权限" value="custom" />
            <el-option label="只读权限" value="read" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="roleForm.status"
            active-value="1"
            inactive-value="0"
            :disabled="currentRoleId && roleForm.roleName === '超级管理员'"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitRole">确定</el-button>
      </template>
    </el-dialog>

    <!-- 权限设置弹窗 -->
    <el-dialog
      v-model="permissionVisible"
      title="角色权限设置"
      width="800px"
      :close-on-click-modal="false"
    >
      <div class="permission-container">
        <h3 class="permission-title">当前角色：{{ currentRoleName }}</h3>
        <el-tree
          :data="menuTree"
          show-checkbox
          node-key="id"
          :checked-keys="checkedMenuIds"
          @check="handleMenuCheck"
          class="menu-tree"
        />
      </div>
      <template #footer>
        <el-button @click="permissionVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitPermission">保存权限</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="deleteVisible"
      title="删除确认"
      width="300px"
      :close-on-click-modal="false"
    >
      <p>确定要删除该角色吗？删除后关联该角色的用户将失去对应权限！</p>
      <template #footer>
        <el-button @click="deleteVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import request from '@/api'
import { Plus, Search, Edit, Delete, Lock } from '@element-plus/icons-vue'

// 表格数据相关
const roleList = ref([]) // 所有角色数据
const menuTree = ref([]) // 菜单树（用于权限设置）
const searchKey = ref('') // 搜索关键词
const currentPage = ref(1) // 当前页码
const pageSize = ref(10) // 每页条数

// 弹窗相关
const dialogVisible = ref(false) // 新增/编辑弹窗显示状态
const permissionVisible = ref(false) // 权限设置弹窗显示状态
const deleteVisible = ref(false) // 删除确认弹窗显示状态
const dialogTitle = ref('新增角色') // 弹窗标题
const currentRoleId = ref('') // 当前编辑/删除/设置权限的角色ID
const currentRoleName = ref('') // 当前设置权限的角色名称

// 权限设置相关
const checkedMenuIds = ref([]) // 选中的菜单ID（权限）

// 表单相关
const roleFormRef = ref(null)
const roleForm = reactive({
  roleName: '',
  description: '',
  permissionScope: 'custom', // 权限范围：all-全部，custom-自定义，read-只读
  status: '1' // 1-启用，0-禁用
})

// 表单校验规则
const roleRules = reactive({
  roleName: [
    { required: true, message: '请输入角色名称', trigger: 'blur' },
    { min: 2, max: 20, message: '角色名称长度为2-20个字符', trigger: 'blur' }
  ],
  permissionScope: [
    { required: true, message: '请选择权限范围', trigger: 'blur' }
  ]
})

// 过滤后的角色列表（搜索+分页）
const filteredRoleList = computed(() => {
  // 搜索过滤
  let filtered = roleList.value.filter(role => {
    return role.roleName.includes(searchKey.value)
  })
  // 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filtered.slice(startIndex, endIndex)
})

// 页面挂载时获取角色列表和菜单树
onMounted(() => {
  getRoleList()
  getMenuTree()
})

// 获取所有角色数据（模拟接口）
const getRoleList = async () => {
  try {
    // const res = await request.get('/system/role/list')
    // roleList.value = res.data
    // 模拟数据
    roleList.value = [
      {
        id: '1',
        roleName: '超级管理员',
        description: '拥有系统全部操作权限',
        permissionScope: 'all',
        status: '1'
      },
      {
        id: '2',
        roleName: '普通用户',
        description: '拥有基础操作权限',
        permissionScope: 'custom',
        status: '1'
      },
      {
        id: '3',
        roleName: '访客',
        description: '仅拥有查看权限',
        permissionScope: 'read',
        status: '1'
      }
    ]
  } catch (error) {
    ElMessage.error('获取角色列表失败，请稍后重试')
  }
}

// 获取菜单树（用于权限设置，模拟接口）
const getMenuTree = async () => {
  try {
    // const res = await request.get('/system/menu/tree')
    // menuTree.value = res.data
    // 模拟数据
    menuTree.value = [
      {
        id: '1',
        label: '首页',
        children: []
      },
      {
        id: '2',
        label: '用户管理',
        children: [
          { id: '3', label: '用户列表' },
          { id: '4', label: '用户详情' }
        ]
      },
      {
        id: '5',
        label: '系统管理',
        children: [
          { id: '6', label: '菜单管理' },
          { id: '7', label: '角色管理' }
        ]
      }
    ]
  } catch (error) {
    ElMessage.error('获取菜单树失败，请稍后重试')
  }
}

// 搜索角色
const handleSearch = () => {
  currentPage.value = 1 // 搜索后重置到第一页
}

// 重置搜索
const resetSearch = () => {
  searchKey.value = ''
  currentPage.value = 1
}

// 分页大小改变
const handleSizeChange = (val) => {
  pageSize.value = val
  currentPage.value = 1
}

// 当前页码改变
const handleCurrentChange = (val) => {
  currentPage.value = val
}

// 新增角色
const handleAddRole = () => {
  dialogTitle.value = '新增角色'
  // 重置表单
  roleFormRef.value?.resetFields()
  roleForm.permissionScope = 'custom'
  roleForm.status = '1'
  currentRoleId.value = ''
  dialogVisible.value = true
}

// 编辑角色
const handleEditRole = (row) => {
  dialogTitle.value = '编辑角色'
  currentRoleId.value = row.id
  // 填充表单数据
  roleForm.roleName = row.roleName
  roleForm.description = row.description
  roleForm.permissionScope = row.permissionScope
  roleForm.status = row.status
  dialogVisible.value = true
}

// 提交新增/编辑角色
const handleSubmitRole = async () => {
  // 表单校验
  const valid = await roleFormRef.value.validate()
  if (!valid) return

  try {
    if (currentRoleId.value) {
      // 编辑角色
      // await request.put(`/system/role/${currentRoleId.value}`, roleForm)
      ElMessage.success('角色编辑成功')
      // 更新本地数据
      const index = roleList.value.findIndex(item => item.id === currentRoleId.value)
      if (index !== -1) {
        roleList.value[index] = { ...roleList.value[index], ...roleForm }
      }
    } else {
      // 新增角色
      // const res = await request.post('/system/role', roleForm)
      ElMessage.success('角色新增成功')
      // 新增本地数据（模拟接口返回的id）
      const newId = String(roleList.value.length + 1)
      roleList.value.push({
        id: newId,
        ...roleForm
      })
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.msg || '操作失败，请稍后重试')
  }
}

// 改变角色状态（启用/禁用）
const handleStatusChange = async (row) => {
  if (row.roleName === '超级管理员') {
    // 超级管理员不能禁用
    row.status = '1'
    ElMessage.warning('超级管理员不能禁用')
    return
  }

  try {
    // await request.put(`/system/role/${row.id}/status`, { status: row.status })
    ElMessage.success(`角色${row.status === '1' ? '启用' : '禁用'}成功`)
  } catch (error) {
    // 失败时回滚状态
    row.status = row.status === '1' ? '0' : '1'
    ElMessage.error('状态修改失败，请稍后重试')
  }
}

// 权限设置
const handleSetPermission = (row) => {
  currentRoleId.value = row.id
  currentRoleName.value = row.roleName
  // 模拟获取该角色已拥有的权限（实际接口请求）
  if (row.permissionScope === 'all') {
    // 全部权限：选中所有菜单
    checkedMenuIds.value = menuTree.value.flatMap(menu => {
      const ids = [menu.id]
      if (menu.children && menu.children.length) {
        ids.push(...menu.children.map(child => child.id))
      }
      return ids
    })
  } else if (row.permissionScope === 'read') {
    // 只读权限：选中部分菜单（模拟）
    checkedMenuIds.value = ['1'] // 仅首页
  } else {
    // 自定义权限：模拟选中部分菜单
    checkedMenuIds.value = ['1', '2', '3'] // 首页、用户管理、用户列表
  }
  permissionVisible.value = true
}

// 菜单勾选事件（权限选择）
const handleMenuCheck = (checkedKeys) => {
  checkedMenuIds.value = checkedKeys
}

// 提交权限设置
const handleSubmitPermission = async () => {
  try {
    // 模拟接口请求：保存角色权限
    // await request.post(`/system/role/${currentRoleId.value}/permission`, { menuIds: checkedMenuIds.value })
    ElMessage.success('权限设置成功')
    permissionVisible.value = false
  } catch (error) {
    ElMessage.error('权限设置失败，请稍后重试')
  }
}

// 点击删除角色
const handleDeleteRole = (id) => {
  const role = roleList.value.find(item => item.id === id)
  if (role?.roleName === '超级管理员') {
    ElMessage.warning('超级管理员不能删除')
    return
  }
  currentRoleId.value = id
  deleteVisible.value = true
}

// 确认删除角色
const confirmDelete = async () => {
  try {
    // 模拟接口请求
    // await request.delete(`/system/role/${currentRoleId.value}`)
    ElMessage.success('角色删除成功')
    // 删除本地数据
    roleList.value = roleList.value.filter(role => role.id !== currentRoleId.value)
    deleteVisible.value = false
  } catch (error) {
    ElMessage.error('删除失败，请稍后重试')
  }
}
</script>

<style scoped lang="scss">
.role-container {
  width: 100%;
  height: 100%;
  padding-bottom: 20px;

  .role-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      font-size: 18px;
      font-weight: 600;
      color: #333;
    }
  }

  .role-card {
    padding: 20px;

    .role-search {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .search-input {
        width: 300px;
      }
    }

    .role-table {
      width: 100%;
      margin-bottom: 20px;

      .edit-btn {
        color: #1890ff;
        margin-right: 16px;
      }

      .permission-btn {
        color: #13c2c2;
        margin-right: 16px;
      }

      .delete-btn {
        color: #f5222d;
      }
    }

    .role-pagination {
      display: flex;
      justify-content: flex-end;
    }
  }

  .role-form {
    padding: 10px 0;
  }

  .permission-container {
    height: 400px;
    overflow-y: auto;

    .permission-title {
      font-size: 16px;
      font-weight: 500;
      margin-bottom: 16px;
      color: #333;
    }

    .menu-tree {
      width: 100%;
    }
  }

  // 适配暗色模式
  :deep(.dark) {
    .role-card,
    el-dialog {
      background: #1f2937;
    }

    h2,
    h3,
    el-table th,
    el-table td,
    el-form-item label,
    el-input,
    el-select,
    .el-tree-node__label {
      color: #f3f4f6;
    }

    el-table {
      --el-table-border-color: #374151;
      --el-table-row-hover-bg-color: #374151;
    }

    el-input__inner,
    el-select__wrapper {
      background: #374151;
      border-color: #4b5563;
      color: #f3f4f6;
    }

    .el-tree {
      --el-tree-node-hover-bg-color: #374151;
    }
  }
}
</style>