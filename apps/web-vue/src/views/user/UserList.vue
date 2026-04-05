<template>
  <div class="user-list-container">
    <div class="user-header">
      <h2>用户列表</h2>
      <el-button type="primary" icon="Plus" @click="handleAddUser">新增用户</el-button>
    </div>

    <el-card shadow="hover" class="user-card">
      <!-- 搜索筛选 -->
      <div class="user-search">
        <el-input
          v-model="searchKey"
          placeholder="请输入用户名/手机号搜索"
          prefix-icon="Search"
          class="search-input"
        />
        <el-select
          v-model="roleId"
          placeholder="请选择角色"
          clearable
          class="role-select"
        >
          <el-option label="全部角色" value="" />
          <el-option
            v-for="role in roleList"
            :key="role.id"
            :label="role.roleName"
            :value="role.id"
          />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button type="text" @click="resetSearch">重置</el-button>
      </div>

      <!-- 用户表格 -->
      <el-table :data="filteredUserList" border stripe class="user-table">
        <el-table-column label="序号" type="index" width="80" />
        <el-table-column label="用户名" prop="userName" width="160" />
        <el-table-column label="手机号" prop="phone" width="160" />
        <el-table-column label="邮箱" prop="email" />
        <el-table-column label="角色" prop="roleName" width="140" />
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
        <el-table-column label="创建时间" prop="createTime" width="180" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              icon="Edit"
              class="edit-btn"
              @click="handleEditUser(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              icon="Delete"
              class="delete-btn"
              @click="handleDeleteUser(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="user-pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          :total="userList.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 新增/编辑用户弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="userFormRef"
        :model="userForm"
        :rules="userRules"
        label-width="120px"
        class="user-form"
      >
        <el-form-item label="用户名" prop="userName">
          <el-input
            v-model="userForm.userName"
            placeholder="请输入用户名"
            :disabled="currentUserId"
          />
        </el-form-item>
        <el-form-item label="密码" prop="password" v-if="!currentUserId">
          <el-input
            v-model="userForm.password"
            type="password"
            placeholder="请输入密码（不少于6位）"
            show-password
          />
        </el-form-item>
        <el-form-item label="手机号" prop="phone">
          <el-input
            v-model="userForm.phone"
            placeholder="请输入手机号"
            maxlength="11"
          />
        </el-form-item>
        <el-form-item label="邮箱" prop="email">
          <el-input
            v-model="userForm.email"
            placeholder="请输入邮箱"
          />
        </el-form-item>
        <el-form-item label="角色" prop="roleId">
          <el-select
            v-model="userForm.roleId"
            placeholder="请选择角色"
            clearable
          >
            <el-option
              v-for="role in roleList"
              :key="role.id"
              :label="role.roleName"
              :value="role.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" prop="status">
          <el-switch
            v-model="userForm.status"
            active-value="1"
            inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitUser">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="deleteVisible"
      title="删除确认"
      width="300px"
      :close-on-click-modal="false"
    >
      <p>确定要删除该用户吗？删除后不可恢复！</p>
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
import { Plus, Search, Edit, Delete } from '@element-plus/icons-vue'

// 表格数据相关
const userList = ref([]) // 所有用户数据
const roleList = ref([]) // 角色列表（用于下拉选择）
const searchKey = ref('') // 搜索关键词
const roleId = ref('') // 角色筛选
const currentPage = ref(1) // 当前页码
const pageSize = ref(10) // 每页条数

// 弹窗相关
const dialogVisible = ref(false) // 新增/编辑弹窗显示状态
const deleteVisible = ref(false) // 删除确认弹窗显示状态
const dialogTitle = ref('新增用户') // 弹窗标题
const currentUserId = ref('') // 当前编辑/删除的用户ID

// 表单相关
const userFormRef = ref(null)
const userForm = reactive({
  userName: '',
  password: '',
  phone: '',
  email: '',
  roleId: '',
  status: '1' // 1-启用，0-禁用
})

// 表单校验规则
const userRules = reactive({
  userName: [
    { required: true, message: '请输入用户名', trigger: 'blur' },
    { min: 2, max: 20, message: '用户名长度为2-20个字符', trigger: 'blur' }
  ],
  password: [
    { required: true, message: '请输入密码', trigger: 'blur' },
    { min: 6, message: '密码长度不能少于6位', trigger: 'blur' }
  ],
  phone: [
    { required: true, message: '请输入手机号', trigger: 'blur' },
    { pattern: /^1[3-9]\d{9}$/, message: '请输入正确的手机号', trigger: 'blur' }
  ],
  email: [
    { required: true, message: '请输入邮箱', trigger: 'blur' },
    { pattern: /^[\w.-]+@[a-zA-Z0-9-]+\.[a-zA-Z]+$/, message: '请输入正确的邮箱', trigger: 'blur' }
  ],
  roleId: [
    { required: true, message: '请选择角色', trigger: 'blur' }
  ]
})

// 过滤后的用户列表（搜索+角色筛选+分页）
const filteredUserList = computed(() => {
  // 搜索+角色筛选
  let filtered = userList.value.filter(user => {
    const namePhoneMatch = user.userName.includes(searchKey.value) || user.phone.includes(searchKey.value)
    const roleMatch = roleId.value ? user.roleId === roleId.value : true
    return namePhoneMatch && roleMatch
  })
  // 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filtered.slice(startIndex, endIndex)
})

// 页面挂载时获取用户列表和角色列表
onMounted(() => {
  getuserList()
  getRoleList()
})

// 获取所有用户数据（模拟接口）
const getuserList = async () => {
  try {
    // const res = await request.get('/user/list')
    // userList.value = res.data
    // 模拟数据
    userList.value = [
      {
        id: '1',
        userName: 'admin',
        phone: '13800138000',
        email: 'admin@example.com',
        roleId: '1',
        roleName: '超级管理员',
        status: '1',
        createTime: '2024-01-01 10:00:00'
      },
      {
        id: '2',
        userName: 'test1',
        phone: '13800138001',
        email: 'test1@example.com',
        roleId: '2',
        roleName: '普通用户',
        status: '1',
        createTime: '2024-01-02 14:30:00'
      },
      {
        id: '3',
        userName: 'test2',
        phone: '13800138002',
        email: 'test2@example.com',
        roleId: '2',
        roleName: '普通用户',
        status: '0',
        createTime: '2024-01-03 09:15:00'
      },
      {
        id: '4',
        userName: 'test3',
        phone: '13800138003',
        email: 'test3@example.com',
        roleId: '3',
        roleName: '访客',
        status: '1',
        createTime: '2024-01-04 16:45:00'
      }
    ]
  } catch (error) {
    ElMessage.error('获取用户列表失败，请稍后重试')
  }
}

// 获取角色列表（模拟接口）
const getRoleList = async () => {
  try {
    // const res = await request.get('/system/role/list')
    // roleList.value = res.data
    // 模拟数据
    roleList.value = [
      { id: '1', roleName: '超级管理员' },
      { id: '2', roleName: '普通用户' },
      { id: '3', roleName: '访客' }
    ]
  } catch (error) {
    ElMessage.error('获取角色列表失败，请稍后重试')
  }
}

// 搜索用户
const handleSearch = () => {
  currentPage.value = 1 // 搜索后重置到第一页
}

// 重置搜索
const resetSearch = () => {
  searchKey.value = ''
  roleId.value = ''
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

// 新增用户
const handleAddUser = () => {
  dialogTitle.value = '新增用户'
  // 重置表单
  userFormRef.value?.resetFields()
  userForm.status = '1'
  currentUserId.value = ''
  dialogVisible.value = true
}

// 编辑用户
const handleEditUser = (row) => {
  dialogTitle.value = '编辑用户'
  currentUserId.value = row.id
  // 填充表单数据
  userForm.userName = row.userName
  userForm.phone = row.phone
  userForm.email = row.email
  userForm.roleId = row.roleId
  userForm.status = row.status
  dialogVisible.value = true
}

// 提交新增/编辑用户
const handleSubmitUser = async () => {
  // 表单校验
  const valid = await userFormRef.value.validate()
  if (!valid) return

  try {
    if (currentUserId.value) {
      // 编辑用户（不修改密码）
      // await request.put(`/user/${currentUserId.value}`, { ...userForm, password: undefined })
      ElMessage.success('用户编辑成功')
      // 更新本地数据
      const index = userList.value.findIndex(item => item.id === currentUserId.value)
      if (index !== -1) {
        userList.value[index] = { ...userList.value[index], ...userForm }
        // 更新角色名称
        const role = roleList.value.find(item => item.id === userForm.roleId)
        userList.value[index].roleName = role?.roleName || ''
      }
    } else {
      // 新增用户
      // const res = await request.post('/user', userForm)
      ElMessage.success('用户新增成功')
      // 新增本地数据（模拟接口返回的id）
      const newId = String(userList.value.length + 1)
      const role = roleList.value.find(item => item.id === userForm.roleId)
      userList.value.push({
        id: newId,
        ...userForm,
        roleName: role?.roleName || '',
        createTime: new Date().toLocaleString('zh-CN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit' })
      })
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.msg || '操作失败，请稍后重试')
  }
}

// 改变用户状态（启用/禁用）
const handleStatusChange = async (row) => {
  try {
    // await request.put(`/user/${row.id}/status`, { status: row.status })
    ElMessage.success(`用户${row.status === '1' ? '启用' : '禁用'}成功`)
  } catch (error) {
    // 失败时回滚状态
    row.status = row.status === '1' ? '0' : '1'
    ElMessage.error('状态修改失败，请稍后重试')
  }
}

// 点击删除用户
const handleDeleteUser = (id) => {
  currentUserId.value = id
  deleteVisible.value = true
}

// 确认删除用户
const confirmDelete = async () => {
  try {
    // 模拟接口请求
    // await request.delete(`/user/${currentUserId.value}`)
    ElMessage.success('用户删除成功')
    // 删除本地数据
    userList.value = userList.value.filter(user => user.id !== currentUserId.value)
    deleteVisible.value = false
  } catch (error) {
    ElMessage.error('删除失败，请稍后重试')
  }
}
</script>

<style scoped lang="scss">
.user-list-container {
  width: 100%;
  height: 100%;
  padding-bottom: 20px;

  .user-header {
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

  .user-card {
    padding: 20px;

    .user-search {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .search-input {
        width: 300px;
      }

      .role-select {
        width: 180px;
      }
    }

    .user-table {
      width: 100%;
      margin-bottom: 20px;

      .edit-btn {
        color: #1890ff;
        margin-right: 16px;
      }

      .delete-btn {
        color: #f5222d;
      }
    }

    .user-pagination {
      display: flex;
      justify-content: flex-end;
    }
  }

  .user-form {
    padding: 10px 0;
  }

  // 适配暗色模式
  :deep(.dark) {
    .user-card,
    el-dialog {
      background: #1f2937;
    }

    h2,
    el-table th,
    el-table td,
    el-form-item label,
    el-input,
    el-select {
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
  }
}
</style>