<template>
  <div class="menu-container">
    <div class="menu-header">
      <h2>菜单管理</h2>
      <el-button type="primary" icon="Plus" @click="handleAddMenu">新增菜单</el-button>
    </div>

    <el-card shadow="hover" class="menu-card">
      <!-- 菜单搜索筛选 -->
      <div class="menu-search">
        <el-input
          v-model="searchKey"
          placeholder="请输入菜单名称/路由搜索"
          prefix-icon="Search"
          class="search-input"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
        <el-button type="text" @click="resetSearch">重置</el-button>
      </div>

      <!-- 菜单表格 -->
      <el-table :data="filteredMenuList" border stripe class="menu-table">
        <el-table-column label="菜单名称" prop="menuName" width="200" />
        <el-table-column label="菜单图标" prop="icon" width="120">
          <template #default="scope">
            <el-icon v-if="scope.row.icon" class="menu-icon">
              <component :is="scope.row.icon" />
            </el-icon>
            <span v-else>-</span>
          </template>
        </el-table-column>
        <el-table-column label="路由地址" prop="path" width="200" />
        <el-table-column label="组件路径" prop="component" />
        <el-table-column label="父菜单" prop="parentName" width="180" />
        <el-table-column label="排序" prop="sort" width="100" />
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
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="scope">
            <el-button
              type="text"
              icon="Edit"
              class="edit-btn"
              @click="handleEditMenu(scope.row)"
            >
              编辑
            </el-button>
            <el-button
              type="text"
              icon="Delete"
              class="delete-btn"
              @click="handleDeleteMenu(scope.row.id)"
            >
              删除
            </el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="menu-pagination">
        <el-pagination
          @size-change="handleSizeChange"
          @current-change="handleCurrentChange"
          :current-page="currentPage"
          :page-sizes="[10, 20, 50]"
          :page-size="pageSize"
          :total="menuList.length"
          layout="total, sizes, prev, pager, next, jumper"
        />
      </div>
    </el-card>

    <!-- 新增/编辑菜单弹窗 -->
    <el-dialog
      v-model="dialogVisible"
      :title="dialogTitle"
      width="600px"
      :close-on-click-modal="false"
    >
      <el-form
        ref="menuFormRef"
        :model="menuForm"
        :rules="menuRules"
        label-width="120px"
        class="menu-form"
      >
        <el-form-item label="父菜单" prop="parentId">
          <el-select
            v-model="menuForm.parentId"
            placeholder="请选择父菜单"
            clearable
          >
            <el-option label="无（一级菜单）" value="0" />
            <el-option
              v-for="item in parentMenuList"
              :key="item.id"
              :label="item.menuName"
              :value="item.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="菜单名称" prop="menuName">
          <el-input
            v-model="menuForm.menuName"
            placeholder="请输入菜单名称"
          />
        </el-form-item>
        <el-form-item label="菜单图标" prop="icon">
          <el-input
            v-model="menuForm.icon"
            placeholder="请输入Element Plus图标名称（如Home）"
          />
          <el-text type="info" class="icon-tip">
            提示：图标名称需与Element Plus图标一致，可参考Element Plus图标文档
          </el-text>
        </el-form-item>
        <el-form-item label="路由地址" prop="path">
          <el-input
            v-model="menuForm.path"
            placeholder="请输入路由地址（如/home）"
          />
        </el-form-item>
        <el-form-item label="组件路径" prop="component">
          <el-input
            v-model="menuForm.component"
            placeholder="请输入组件路径（如@/views/home/Home.vue）"
          />
        </el-form-item>
        <el-form-item label="排序" prop="sort">
          <el-input
            v-model.number="menuForm.sort"
            placeholder="请输入排序号（数字越小越靠前）"
            type="number"
          />
        </el-form-item>
        <el-form-item label="是否显示" prop="status">
          <el-switch
            v-model="menuForm.status"
            active-value="1"
            inactive-value="0"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSubmitMenu">确定</el-button>
      </template>
    </el-dialog>

    <!-- 删除确认弹窗 -->
    <el-dialog
      v-model="deleteVisible"
      title="删除确认"
      width="300px"
      :close-on-click-modal="false"
    >
      <p>确定要删除该菜单吗？删除后不可恢复！</p>
      <template #footer>
        <el-button @click="deleteVisible = false">取消</el-button>
        <el-button type="danger" @click="confirmDelete">确定删除</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useRouter } from 'vue-router'
import request from '@/api'
import { 
  Plus, Search, Edit, Delete, House, Setting, 
  User, Memo, Menu as MenuIcon 
} from '@element-plus/icons-vue'

const router = useRouter()

// 表格数据相关
const menuList = ref([]) // 所有菜单数据
const searchKey = ref('') // 搜索关键词
const currentPage = ref(1) // 当前页码
const pageSize = ref(10) // 每页条数

// 弹窗相关
const dialogVisible = ref(false) // 新增/编辑弹窗显示状态
const deleteVisible = ref(false) // 删除确认弹窗显示状态
const dialogTitle = ref('新增菜单') // 弹窗标题
const currentMenuId = ref('') // 当前编辑/删除的菜单ID

// 表单相关
const menuFormRef = ref(null)
const menuForm = reactive({
  parentId: '0', // 父菜单ID，0表示一级菜单
  menuName: '',
  icon: '',
  path: '',
  component: '',
  sort: 0,
  status: '1' // 1-显示，0-隐藏
})

// 表单校验规则
const menuRules = reactive({
  menuName: [
    { required: true, message: '请输入菜单名称', trigger: 'blur' },
    { min: 2, max: 20, message: '菜单名称长度为2-20个字符', trigger: 'blur' }
  ],
  path: [
    { required: true, message: '请输入路由地址', trigger: 'blur' },
    { pattern: /^\/\w+$/, message: '路由地址以/开头，只能包含字母、数字和下划线', trigger: 'blur' }
  ],
  component: [
    { required: true, message: '请输入组件路径', trigger: 'blur' }
  ],
  sort: [
    { required: true, message: '请输入排序号', trigger: 'blur' },
    { type: 'number', message: '排序号必须为数字', trigger: 'blur' }
  ]
})

// 过滤后的菜单列表（搜索+分页）
const filteredMenuList = computed(() => {
  // 搜索过滤
  let filtered = menuList.value.filter(menu => {
    const menuNameMatch = menu.menuName.includes(searchKey.value)
    const pathMatch = menu.path.includes(searchKey.value)
    return menuNameMatch || pathMatch
  })
  // 分页处理
  const startIndex = (currentPage.value - 1) * pageSize.value
  const endIndex = startIndex + pageSize.value
  return filtered.slice(startIndex, endIndex)
})

// 父菜单列表（只显示一级菜单，用于下拉选择）
const parentMenuList = computed(() => {
  return menuList.value.filter(menu => menu.parentId === '0')
})

// 页面挂载时获取菜单列表
onMounted(() => {
  getMenuList()
})

// 获取所有菜单数据（模拟接口，实际替换为真实接口）
const getMenuList = async () => {
  try {
    // 模拟接口请求
    // const res = await request.get('/system/menu/list')
    // menuList.value = res.data
    // 模拟数据
    menuList.value = [
      {
        id: '1',
        menuName: '首页',
        icon: 'House',
        path: '/home',
        component: '@/views/home/Home.vue',
        parentId: '0',
        parentName: '无（一级菜单）',
        sort: 1,
        status: '1'
      },
      {
        id: '2',
        menuName: '用户管理',
        icon: 'User',
        path: '/user',
        component: '@/components/layout/Layout.vue',
        parentId: '0',
        parentName: '无（一级菜单）',
        sort: 2,
        status: '1'
      },
      {
        id: '3',
        menuName: '用户列表',
        icon: '',
        path: '/user/list',
        component: '@/views/user/UserList.vue',
        parentId: '2',
        parentName: '用户管理',
        sort: 1,
        status: '1'
      },
      {
        id: '4',
        menuName: '系统管理',
        icon: 'Setting',
        path: '/system',
        component: '@/components/layout/Layout.vue',
        parentId: '0',
        parentName: '无（一级菜单）',
        sort: 3,
        status: '1'
      },
      {
        id: '5',
        menuName: '菜单管理',
        icon: 'Menu',
        path: '/system/menu',
        component: '@/views/system/Menu.vue',
        parentId: '4',
        parentName: '系统管理',
        sort: 1,
        status: '1'
      },
      {
        id: '6',
        menuName: '角色管理',
        icon: 'Memo',
        path: '/system/role',
        component: '@/views/system/Role.vue',
        parentId: '4',
        parentName: '系统管理',
        sort: 2,
        status: '1'
      }
    ]
  } catch (error) {
    ElMessage.error('获取菜单列表失败，请稍后重试')
  }
}

// 搜索菜单
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

// 新增菜单
const handleAddMenu = () => {
  dialogTitle.value = '新增菜单'
  // 重置表单
  menuFormRef.value?.resetFields()
  menuForm.parentId = '0'
  menuForm.status = '1'
  currentMenuId.value = ''
  dialogVisible.value = true
}

// 编辑菜单
const handleEditMenu = (row) => {
  dialogTitle.value = '编辑菜单'
  currentMenuId.value = row.id
  // 填充表单数据
  menuForm.parentId = row.parentId
  menuForm.menuName = row.menuName
  menuForm.icon = row.icon
  menuForm.path = row.path
  menuForm.component = row.component
  menuForm.sort = row.sort
  menuForm.status = row.status
  dialogVisible.value = true
}

// 提交新增/编辑菜单
const handleSubmitMenu = async () => {
  // 表单校验
  const valid = await menuFormRef.value.validate()
  if (!valid) return

  try {
    if (currentMenuId.value) {
      // 编辑菜单
      // await request.put(`/system/menu/${currentMenuId.value}`, menuForm)
      ElMessage.success('菜单编辑成功')
      // 更新本地数据
      const index = menuList.value.findIndex(item => item.id === currentMenuId.value)
      if (index !== -1) {
        menuList.value[index] = { ...menuList.value[index], ...menuForm }
        // 更新父菜单名称
        if (menuForm.parentId === '0') {
          menuList.value[index].parentName = '无（一级菜单）'
        } else {
          const parentMenu = menuList.value.find(item => item.id === menuForm.parentId)
          menuList.value[index].parentName = parentMenu?.menuName || '无（一级菜单）'
        }
      }
    } else {
      // 新增菜单
      // const res = await request.post('/system/menu', menuForm)
      ElMessage.success('菜单新增成功')
      // 新增本地数据（模拟接口返回的id）
      const newId = String(menuList.value.length + 1)
      const parentName = menuForm.parentId === '0' 
        ? '无（一级菜单）' 
        : menuList.value.find(item => item.id === menuForm.parentId)?.menuName || '无（一级菜单）'
      menuList.value.push({
        id: newId,
        ...menuForm,
        parentName
      })
    }
    dialogVisible.value = false
  } catch (error) {
    ElMessage.error(error.msg || '操作失败，请稍后重试')
  }
}

// 改变菜单状态（显示/隐藏）
const handleStatusChange = async (row) => {
  try {
    // 模拟接口请求
    // await request.put(`/system/menu/${row.id}/status`, { status: row.status })
    ElMessage.success(`菜单${row.status === '1' ? '显示' : '隐藏'}成功`)
  } catch (error) {
    // 失败时回滚状态
    row.status = row.status === '1' ? '0' : '1'
    ElMessage.error('状态修改失败，请稍后重试')
  }
}

// 点击删除菜单
const handleDeleteMenu = (id) => {
  currentMenuId.value = id
  deleteVisible.value = true
}

// 确认删除菜单
const confirmDelete = async () => {
  try {
    // 检查是否有子菜单
    const hasChildren = menuList.value.some(menu => menu.parentId === currentMenuId.value)
    if (hasChildren) {
      ElMessage.warning('该菜单存在子菜单，无法删除')
      deleteVisible.value = false
      return
    }

    // 模拟接口请求
    // await request.delete(`/system/menu/${currentMenuId.value}`)
    ElMessage.success('菜单删除成功')
    // 删除本地数据
    menuList.value = menuList.value.filter(menu => menu.id !== currentMenuId.value)
    deleteVisible.value = false
  } catch (error) {
    ElMessage.error('删除失败，请稍后重试')
  }
}
</script>

<style scoped lang="scss">
.menu-container {
  width: 100%;
  height: 100%;
  padding-bottom: 20px;

  .menu-header {
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

  .menu-card {
    padding: 20px;

    .menu-search {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;

      .search-input {
        width: 300px;
      }
    }

    .menu-table {
      width: 100%;
      margin-bottom: 20px;

      .menu-icon {
        font-size: 16px;
        color: #1890ff;
      }

      .edit-btn {
        color: #1890ff;
        margin-right: 16px;
      }

      .delete-btn {
        color: #f5222d;
      }
    }

    .menu-pagination {
      display: flex;
      justify-content: flex-end;
    }
  }

  .menu-form {
    padding: 10px 0;

    .icon-tip {
      font-size: 12px;
      margin-top: 8px;
      display: block;
    }
  }

  // 适配暗色模式
  :deep(.dark) {
    .menu-card,
    el-dialog {
      background: #1f2937;
    }

    h2,
    el-table th,
    el-table td,
    el-form-item label,
    el-text,
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