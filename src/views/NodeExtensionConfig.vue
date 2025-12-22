<template>
  <div class="java-code-editor">
    <h2>SPI节点扩展配置管理</h2>

    <!-- 工具栏 -->
    <el-form :inline="true" class="toolbar">
      <el-form-item>
        <el-button type="primary" @click="handleAdd" icon="el-icon-plus">新增扩展</el-button>
        <el-button @click="loadExtensionList" icon="el-icon-refresh">刷新列表</el-button>
        <el-button @click="showLoadedExtensions" icon="el-icon-view">查看已加载</el-button>
      </el-form-item>
    </el-form>

    <!-- SPI扩展列表 -->
    <el-table
      :data="extensionList"
      border
      style="width: 100%; margin-bottom: 20px"
      v-loading="tableLoading"
    >
      <el-table-column prop="codeId" label="ID" width="80"></el-table-column>
      <el-table-column label="关联节点" width="150">
        <template slot-scope="scope">
          {{ getNodeName(scope.row.nodeId) }}
        </template>
      </el-table-column>
      <el-table-column prop="extensionName" label="扩展名称" width="150"></el-table-column>
      <el-table-column prop="className" label="实现类" min-width="200" show-overflow-tooltip></el-table-column>
      <el-table-column prop="description" label="描述" min-width="150" show-overflow-tooltip></el-table-column>
      <el-table-column prop="enabled" label="状态" width="80" align="center">
        <template slot-scope="scope">
          <el-tag :type="scope.row.enabled === 1 ? 'success' : 'info'" size="small">
            {{ scope.row.enabled === 1 ? '启用' : '禁用' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="180" fixed="right">
        <template slot-scope="scope">
          <el-button size="mini" @click="handleEdit(scope.row)" icon="el-icon-edit">编辑</el-button>
          <el-button 
            v-if="scope.row.enabled === 1" 
            size="mini" 
            type="danger" 
            @click="handleDisable(scope.row)" 
            icon="el-icon-close"
          >禁用</el-button>
        </template>
      </el-table-column>
    </el-table>

    <!-- 新增/编辑扩展对话框 -->
    <el-dialog
      :title="dialogTitle"
      :visible.sync="dialogVisible"
      width="80%"
      top="5vh"
      :close-on-click-modal="false"
    >
      <el-form :model="extensionForm" label-width="120px" ref="extensionForm" :rules="formRules">
        <el-form-item label="关联节点" prop="nodeId">
          <el-select 
            v-model="extensionForm.nodeId" 
            placeholder="请选择要关联的节点" 
            style="width: 100%"
            filterable
          >
            <el-option 
              v-for="node in nodeList" 
              :key="node.nodeId" 
              :label="node.nodeName" 
              :value="node.nodeId"
            ></el-option>
          </el-select>
          <span class="form-tip">保存后会自动更新节点的 remoteExtension 字段</span>
        </el-form-item>

        <el-form-item label="扩展名称" prop="extensionName">
          <el-input 
            v-model="extensionForm.extensionName" 
            placeholder="例如: custom-http"
            :disabled="isEdit"
          ></el-input>
          <span class="form-tip">用于节点配置中的 remoteExtension 字段关联</span>
        </el-form-item>

        <el-form-item label="实现类全名" prop="className">
          <el-input 
            v-model="extensionForm.className" 
            placeholder="例如: com.helianhealth.agent.custom.MyRemoteInvoker"
          ></el-input>
        </el-form-item>

        <el-form-item label="描述" prop="description">
          <el-input 
            v-model="extensionForm.description" 
            type="textarea" 
            :rows="2"
            placeholder="请输入扩展描述"
          ></el-input>
        </el-form-item>

        <el-form-item label="Java源代码" prop="sourceCode">
          <el-input
            v-model="extensionForm.sourceCode"
            type="textarea"
            :rows="20"
            placeholder="请输入Java源代码..."
            style="font-family: 'Consolas', 'Monaco', 'Courier New', monospace;"
          ></el-input>
          <div class="code-toolbar">
            <el-button size="mini" @click="handleValidateCode" icon="el-icon-check">语法校验</el-button>
            <el-button size="mini" @click="handleFormatCode" icon="el-icon-s-operation">格式化</el-button>
            <el-button size="mini" @click="applyTemplate('remoteInvoker')" icon="el-icon-document">使用模板</el-button>
          </div>
        </el-form-item>

        <el-form-item label="状态" prop="enabled">
          <el-switch 
            v-model="extensionForm.enabled" 
            :active-value="1" 
            :inactive-value="0"
            active-text="启用" 
            inactive-text="禁用"
          ></el-switch>
        </el-form-item>
      </el-form>

      <!-- 语法错误提示 -->
      <el-collapse v-if="validationErrors.length > 0" v-model="activeCollapse" class="error-panel">
        <el-collapse-item title="语法错误详情" name="errors">
          <el-alert
            v-for="(error, index) in validationErrors"
            :key="index"
            :title="error.message"
            type="error"
            :closable="false"
            class="error-item"
          >
            <div v-if="error.line">行 {{ error.line }}: {{ error.detail }}</div>
          </el-alert>
        </el-collapse-item>
      </el-collapse>

      <div slot="footer">
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveExtension" :loading="saveLoading">保存</el-button>
      </div>
    </el-dialog>

    <!-- 已加载扩展对话框 -->
    <el-dialog
      title="当前已加载的SPI扩展（运行时）"
      :visible.sync="loadedDialogVisible"
      width="60%"
    >
      <el-table :data="loadedExtensionList" border>
        <el-table-column prop="spiType" label="SPI接口" min-width="200" show-overflow-tooltip></el-table-column>
        <el-table-column prop="extensionName" label="扩展名称" width="150"></el-table-column>
        <el-table-column prop="className" label="实现类" min-width="200" show-overflow-tooltip></el-table-column>
      </el-table>
      <div slot="footer">
        <el-button type="primary" @click="loadedDialogVisible = false">关闭</el-button>
      </div>
    </el-dialog>
  </div>
</template>

<script>
import { Message, MessageBox } from 'element-ui';
import { 
  getEnabledConfigs, 
  getLoadedExtensions, 
  registerExtension, 
  updateExtension, 
  disableExtension 
} from '@/api/nodeExtension';
import { getAllNodes } from '@/api/workflow';

export default {
  name: 'NodeExtensionConfig',
  data() {
    return {
      // 列表数据
      extensionList: [],
      nodeList: [], // 节点列表
      tableLoading: false,
      
      // 对话框
      dialogVisible: false,
      loadedDialogVisible: false,
      dialogTitle: '新增SPI扩展',
      isEdit: false,
      saveLoading: false,
      
      // 表单数据
      extensionForm: {
        codeId: null,
        nodeId: null,
        spiInterface: 'com.helianhealth.agent.invocation.remote.InterfaceRemoteInvoker',
        extensionName: '',
        className: '',
        sourceCode: '',
        description: '',
        enabled: 1
      },
      
      // 表单校验规则
      formRules: {
        nodeId: [{ required: true, message: '请选择关联节点', trigger: 'change' }],
        extensionName: [{ required: true, message: '请输入扩展名称', trigger: 'blur' }],
        className: [{ required: true, message: '请输入实现类全名', trigger: 'blur' }],
        sourceCode: [{ required: true, message: '请输入Java源代码', trigger: 'blur' }]
      },
      
      // 已加载的扩展
      loadedExtensionList: [],
      
      // 语法校验
      validationErrors: [],
      activeCollapse: ['errors'],
      
      // 代码模板
      templates: {
        remoteInvoker: `package com.helianhealth.agent.extension;

import com.helianhealth.agent.invocation.remote.InterfaceRemoteInvoker;
import com.helianhealth.agent.workflow.model.domain.InterfaceWorkflowNode;
import java.util.Map;

/**
 * 自定义远程调用实现示例
 */
public class CustomInvoker implements InterfaceRemoteInvoker {
    
    @Override
    public Map<String, Object> remoteInvoke(InterfaceWorkflowNode node, Map<String, Object> businessData) {
        // TODO: 实现自定义调用逻辑
        System.out.println("自定义调用: " + node.getNodeName());
        
        return businessData;
    }
}`
      }
    };
  },
  mounted() {
    this.loadExtensionList();
    this.loadNodeList();
  },
  methods: {
    // 加载扩展列表
    async loadExtensionList() {
      this.tableLoading = true;
      try {
        const response = await getEnabledConfigs();
        // 处理响应数据 - 后端返回的是 {code, message, rsp}
        if (response && response.data) {
          const result = response.data;
          this.extensionList = Array.isArray(result.rsp) ? result.rsp : 
                               Array.isArray(result.data) ? result.data : 
                               Array.isArray(result) ? result : [];
        } else {
          this.extensionList = [];
        }
      } catch (error) {
        Message.error('加载扩展列表失败：' + (error.message || '未知错误'));
        this.extensionList = [];
      } finally {
        this.tableLoading = false;
      }
    },

    // 加载节点列表
    async loadNodeList() {
      try {
        const response = await getAllNodes();
        console.log('loadNodeList response:', response);
        // 处理响应数据 - 后端返回的是 {code, message, rsp}
        if (response && response.data) {
          const result = response.data;
          // 支持两种响应格式
          this.nodeList = Array.isArray(result.rsp) ? result.rsp : 
                          Array.isArray(result.data) ? result.data : 
                          Array.isArray(result) ? result : [];
        } else {
          this.nodeList = [];
        }
        console.log('nodeList loaded:', this.nodeList);
      } catch (error) {
        console.error('加载节点列表失败:', error);
        this.nodeList = []; // 确保失败时也是数组
        Message.error('加载节点列表失败，请刷新重试');
      }
    },

    // 新增扩展
    async handleAdd() {
      // 确保节点列表已加载
      if (!this.nodeList || this.nodeList.length === 0) {
        await this.loadNodeList();
      }
      
      this.dialogTitle = '新增SPI扩展';
      this.isEdit = false;
      this.extensionForm = {
        codeId: null,
        nodeId: null,
        spiInterface: 'com.helianhealth.agent.invocation.remote.InterfaceRemoteInvoker',
        extensionName: '',
        className: '',
        sourceCode: '',
        description: '',
        enabled: 1
      };
      this.validationErrors = [];
      this.dialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.extensionForm) {
          this.$refs.extensionForm.clearValidate();
        }
      });
    },

    // 编辑扩展
    handleEdit(row) {
      this.dialogTitle = '编辑SPI扩展';
      this.isEdit = true;
      this.extensionForm = { ...row };
      this.validationErrors = [];
      this.dialogVisible = true;
      this.$nextTick(() => {
        if (this.$refs.extensionForm) {
          this.$refs.extensionForm.clearValidate();
        }
      });
    },

    // 保存扩展
    async handleSaveExtension() {
      try {
        await this.$refs.extensionForm.validate();
      } catch (error) {
        return;
      }

      this.saveLoading = true;
      try {
        if (this.isEdit) {
          await updateExtension(this.extensionForm);
          Message.success('更新成功，已热刷新');
        } else {
          await registerExtension(this.extensionForm);
          Message.success('新增成功，已注册到系统');
        }
        this.dialogVisible = false;
        this.loadExtensionList();
      } catch (error) {
        Message.error('保存失败：' + (error.message || '未知错误'));
      } finally {
        this.saveLoading = false;
      }
    },

    // 禁用扩展
    async handleDisable(row) {
      try {
        await MessageBox.confirm(
          `确定要禁用扩展 "${row.extensionName}" 吗？禁用后将从运行时卸载。`, 
          '警告', 
          {
            confirmButtonText: '确定',
            cancelButtonText: '取消',
            type: 'warning'
          }
        );
        
        await disableExtension(row.codeId);
        Message.success('禁用成功');
        this.loadExtensionList();
      } catch (error) {
        if (error !== 'cancel') {
          Message.error('禁用失败：' + (error.message || '未知错误'));
        }
      }
    },

    // 查看已加载的扩展
    async showLoadedExtensions() {
      try {
        const { data } = await getLoadedExtensions();
        // 转换Map为数组
        this.loadedExtensionList = [];
        if (data && typeof data === 'object') {
          Object.entries(data).forEach(([key, value]) => {
            this.loadedExtensionList.push({
              spiType: key.substring(0, key.lastIndexOf('.') || key.length),
              extensionName: key.substring(key.lastIndexOf('.') + 1),
              className: value.name || value
            });
          });
        }
        this.loadedDialogVisible = true;
      } catch (error) {
        Message.error('加载运行时扩展失败：' + (error.message || '未知错误'));
      }
    },

    // 根据节点ID获取节点名称
    getNodeName(nodeId) {
      if (!nodeId) return '-';
      const node = this.nodeList.find(n => n.nodeId === nodeId);
      return node ? node.nodeName : `节点${nodeId}`;
    },

    // 语法校验代码
    handleValidateCode() {
      this.validationErrors = [];
      
      if (!this.extensionForm.sourceCode.trim()) {
        Message.warning('请先输入Java代码');
        return;
      }

      const errors = [];
      const lines = this.extensionForm.sourceCode.split('\n');
      
      // 检查是否有类定义
      const hasClass = /\b(class|interface|enum)\s+\w+/.test(this.extensionForm.sourceCode);
      if (!hasClass) {
        errors.push({
          message: '缺少类、接口或枚举定义',
          detail: '代码中应至少包含一个 class、interface 或 enum 定义'
        });
      }

      // 检查大括号匹配
      const openBraces = (this.extensionForm.sourceCode.match(/\{/g) || []).length;
      const closeBraces = (this.extensionForm.sourceCode.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        errors.push({
          message: '大括号不匹配',
          detail: `打开的大括号: ${openBraces}, 关闭的大括号: ${closeBraces}`
        });
      }

      // 检查小括号匹配
      const openParens = (this.extensionForm.sourceCode.match(/\(/g) || []).length;
      const closeParens = (this.extensionForm.sourceCode.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        errors.push({
          message: '小括号不匹配',
          detail: `打开的小括号: ${openParens}, 关闭的小括号: ${closeParens}`
        });
      }

      // 检查分号
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.startsWith('//') || 
            trimmedLine.startsWith('/*') || 
            trimmedLine.startsWith('*') ||
            trimmedLine === '' ||
            trimmedLine === '{' ||
            trimmedLine === '}' ||
            trimmedLine.startsWith('@')) {
          return;
        }

        if (trimmedLine.match(/^\s*(private|public|protected|static|final|return|int|String|void|boolean|long|double|float)/)) {
          if (!trimmedLine.endsWith(';') && 
              !trimmedLine.endsWith('{') && 
              !trimmedLine.endsWith('}')) {
            errors.push({
              message: '可能缺少分号',
              line: index + 1,
              detail: trimmedLine
            });
          }
        }
      });

      this.validationErrors = errors;
      
      if (errors.length === 0) {
        Message.success('语法校验通过！');
      } else {
        Message.error(`发现 ${errors.length} 个语法问题`);
      }
    },

    // 代码格式化
    handleFormatCode() {
      if (!this.extensionForm.sourceCode.trim()) {
        Message.warning('请先输入代码');
        return;
      }

      let indentLevel = 0;
      const lines = this.extensionForm.sourceCode.split('\n');
      const formattedLines = [];

      lines.forEach(line => {
        const trimmed = line.trim();
        
        if (trimmed.startsWith('}')) {
          indentLevel = Math.max(0, indentLevel - 1);
        }

        const indent = '    '.repeat(indentLevel);
        formattedLines.push(indent + trimmed);

        if (trimmed.endsWith('{')) {
          indentLevel++;
        }
      });

      this.extensionForm.sourceCode = formattedLines.join('\n');
      Message.success('代码已格式化');
    },

    // 应用模板
    applyTemplate(templateType) {
      if (this.extensionForm.sourceCode.trim()) {
        MessageBox.confirm('应用模板将覆盖当前代码，是否继续？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        }).then(() => {
          this.extensionForm.sourceCode = this.templates[templateType];
          this.validationErrors = [];
          Message.success('模板已应用');
        }).catch(() => {});
      } else {
        this.extensionForm.sourceCode = this.templates[templateType];
        Message.success('模板已应用');
      }
    }
  }
};
</script>

<style scoped>
.java-code-editor {
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}

.toolbar {
  margin-bottom: 15px;
}

.form-tip {
  font-size: 12px;
  color: #909399;
  margin-left: 10px;
}

.code-toolbar {
  margin-top: 10px;
  text-align: right;
}

.error-panel {
  margin-top: 15px;
}

.error-item {
  margin-bottom: 10px;
}
</style>
