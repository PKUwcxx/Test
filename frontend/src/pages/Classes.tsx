import React, { useState, useEffect } from 'react';
import {
  Table,
  Button,
  Space,
  Modal,
  Form,
  Input,
  Select,
  message,
  Popconfirm,
  Card,
  Row,
  Col,
  Statistic,
  Tag,
  Progress,
  Tooltip,
  InputNumber,
  Transfer,
  List,
  Avatar
} from 'antd';
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  TeamOutlined,
  SearchOutlined,
  ReloadOutlined,
  UserAddOutlined,
  UserDeleteOutlined
} from '@ant-design/icons';
import { Class, Student, Teacher, ApiResponse } from '../types';
import api from '../services/api';

const { Option } = Select;
const { Search } = Input;

const Classes: React.FC = () => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [studentModalVisible, setStudentModalVisible] = useState(false);
  const [teacherModalVisible, setTeacherModalVisible] = useState(false);
  const [editingClass, setEditingClass] = useState<Class | null>(null);
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [form] = Form.useForm();
  const [searchText, setSearchText] = useState('');
  const [filters, setFilters] = useState({
    grade: '',
    academicYear: '',
    semester: ''
  });
  const [stats, setStats] = useState({
    totalClasses: 0,
    gradeStats: [],
    capacityStats: []
  });
  const [transferData, setTransferData] = useState<any[]>([]);
  const [targetKeys, setTargetKeys] = useState<string[]>([]);

  // 获取班级列表
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchText) params.append('search', searchText);
      if (filters.grade) params.append('grade', filters.grade);
      if (filters.academicYear) params.append('academicYear', filters.academicYear);
      if (filters.semester) params.append('semester', filters.semester);

      const response = await api.get<ApiResponse<{ classes: Class[] }>>(`/classes?${params}`);
      if (response.data.success) {
        setClasses(response.data.data.classes);
      }
    } catch (error) {
      message.error('获取班级列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取统计信息
  const fetchStats = async () => {
    try {
      const response = await api.get<ApiResponse<any>>('/classes/stats');
      if (response.data.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('获取统计信息失败:', error);
    }
  };

  // 获取学生列表
  const fetchStudents = async () => {
    try {
      const response = await api.get<ApiResponse<{ students: Student[] }>>('/students?limit=1000');
      if (response.data.success) {
        setStudents(response.data.data.students);
      }
    } catch (error) {
      console.error('获取学生列表失败:', error);
    }
  };

  // 获取教师列表
  const fetchTeachers = async () => {
    try {
      const response = await api.get<ApiResponse<{ teachers: Teacher[] }>>('/teachers?limit=1000');
      if (response.data.success) {
        setTeachers(response.data.data.teachers);
      }
    } catch (error) {
      console.error('获取教师列表失败:', error);
    }
  };

  useEffect(() => {
    fetchClasses();
    fetchStats();
    fetchStudents();
    fetchTeachers();
  }, [searchText, filters]);

  // 处理添加/编辑班级
  const handleSubmit = async (values: any) => {
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass._id}`, values);
        message.success('更新班级信息成功');
      } else {
        await api.post('/classes', values);
        message.success('添加班级成功');
      }

      setModalVisible(false);
      setEditingClass(null);
      form.resetFields();
      fetchClasses();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '操作失败');
    }
  };

  // 处理删除班级
  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/classes/${id}`);
      message.success('删除班级成功');
      fetchClasses();
      fetchStats();
    } catch (error: any) {
      message.error(error.response?.data?.message || '删除失败');
    }
  };

  // 打开编辑模态框
  const handleEdit = (classItem: Class) => {
    setEditingClass(classItem);
    form.setFieldsValue(classItem);
    setModalVisible(true);
  };

  // 管理学生
  const handleManageStudents = (classItem: Class) => {
    setSelectedClass(classItem);
    
    // 准备穿梭框数据
    const availableStudents = students.filter(student => 
      !student.academicInfo?.currentClass || 
      student.academicInfo.currentClass === classItem._id
    );
    
    const transferItems = availableStudents.map(student => ({
      key: student._id,
      title: `${student.profile.firstName} ${student.profile.lastName}`,
      description: `学号: ${student.studentId}`,
      avatar: student.profile.avatar
    }));
    
    const currentStudentIds = classItem.students?.map((s: any) => 
      typeof s === 'string' ? s : s._id
    ) || [];
    
    setTransferData(transferItems);
    setTargetKeys(currentStudentIds);
    setStudentModalVisible(true);
  };

  // 管理教师
  const handleManageTeachers = (classItem: Class) => {
    setSelectedClass(classItem);
    
    // 准备穿梭框数据
    const transferItems = teachers.map(teacher => ({
      key: teacher._id,
      title: teacher.name,
      description: `${teacher.position} - ${teacher.department}`,
      avatar: teacher.avatar
    }));
    
    const currentTeacherIds = classItem.teachers?.map((t: any) => 
      typeof t === 'string' ? t : t._id
    ) || [];
    
    setTransferData(transferItems);
    setTargetKeys(currentTeacherIds);
    setTeacherModalVisible(true);
  };

  // 保存学生分配
  const handleSaveStudents = async () => {
    if (!selectedClass) return;
    
    try {
      const currentStudentIds = selectedClass.students?.map((s: any) => 
        typeof s === 'string' ? s : s._id
      ) || [];
      
      // 找出需要添加和移除的学生
      const toAdd = targetKeys.filter(id => !currentStudentIds.includes(id));
      const toRemove = currentStudentIds.filter(id => !targetKeys.includes(id));
      
      // 添加学生
      for (const studentId of toAdd) {
        await api.post(`/classes/${selectedClass._id}/students`, { studentId });
      }
      
      // 移除学生
      for (const studentId of toRemove) {
        await api.delete(`/classes/${selectedClass._id}/students/${studentId}`);
      }
      
      message.success('学生分配更新成功');
      setStudentModalVisible(false);
      fetchClasses();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  // 保存教师分配
  const handleSaveTeachers = async () => {
    if (!selectedClass) return;
    
    try {
      const currentTeacherIds = selectedClass.teachers?.map((t: any) => 
        typeof t === 'string' ? t : t._id
      ) || [];
      
      // 找出需要添加和移除的教师
      const toAdd = targetKeys.filter(id => !currentTeacherIds.includes(id));
      const toRemove = currentTeacherIds.filter(id => !targetKeys.includes(id));
      
      // 添加教师
      for (const teacherId of toAdd) {
        await api.post(`/classes/${selectedClass._id}/teachers`, { teacherId });
      }
      
      // 移除教师
      for (const teacherId of toRemove) {
        await api.delete(`/classes/${selectedClass._id}/teachers/${teacherId}`);
      }
      
      message.success('教师分配更新成功');
      setTeacherModalVisible(false);
      fetchClasses();
    } catch (error: any) {
      message.error(error.response?.data?.message || '更新失败');
    }
  };

  // 表格列定义
  const columns = [
    {
      title: '班级名称',
      dataIndex: 'name',
      key: 'name',
      render: (name: string, record: Class) => (
        <div>
          <div style={{ fontWeight: 'bold' }}>{name}</div>
          <div style={{ fontSize: '12px', color: '#666' }}>
            {record.academicYear} {record.semester === 'spring' ? '春季' : '秋季'}学期
          </div>
        </div>
      ),
    },
    {
      title: '年级',
      dataIndex: 'grade',
      key: 'grade',
      render: (grade: string) => (
        <Tag color={getGradeColor(grade)}>{grade}</Tag>
      ),
    },
    {
      title: '教室',
      key: 'classroom',
      render: (record: Class) => (
        <div>
          <div>{record.classroom?.number}</div>
          {record.classroom?.building && (
            <div style={{ fontSize: '12px', color: '#666' }}>
              {record.classroom.building}
            </div>
          )}
        </div>
      ),
    },
    {
      title: '学生人数',
      key: 'studentCount',
      render: (record: Class) => {
        const current = record.students?.length || 0;
        const capacity = record.capacity;
        const percentage = capacity > 0 ? (current / capacity) * 100 : 0;
        
        return (
          <div>
            <div>{current}/{capacity}</div>
            <Progress 
              percent={percentage} 
              size="small" 
              status={percentage > 90 ? 'exception' : 'normal'}
              showInfo={false}
            />
          </div>
        );
      },
    },
    {
      title: '教师',
      key: 'teachers',
      render: (record: Class) => (
        <div>
          {record.teachers?.slice(0, 2).map((teacher: any, index: number) => (
            <Tag key={index} style={{ marginBottom: '2px' }}>
              {typeof teacher === 'string' ? teacher : teacher.name}
            </Tag>
          ))}
          {record.teachers && record.teachers.length > 2 && (
            <Tag>+{record.teachers.length - 2}</Tag>
          )}
        </div>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status === 'active' ? '活跃' : '非活跃'}
        </Tag>
      ),
    },
    {
      title: '操作',
      key: 'action',
      width: 200,
      render: (record: Class) => (
        <Space>
          <Tooltip title="编辑">
            <Button
              type="primary"
              icon={<EditOutlined />}
              size="small"
              onClick={() => handleEdit(record)}
            />
          </Tooltip>
          <Tooltip title="管理学生">
            <Button
              icon={<UserAddOutlined />}
              size="small"
              onClick={() => handleManageStudents(record)}
            />
          </Tooltip>
          <Tooltip title="管理教师">
            <Button
              icon={<TeamOutlined />}
              size="small"
              onClick={() => handleManageTeachers(record)}
            />
          </Tooltip>
          <Popconfirm
            title="确定要删除这个班级吗？"
            onConfirm={() => handleDelete(record._id)}
            okText="确定"
            cancelText="取消"
          >
            <Tooltip title="删除">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // 获取年级颜色
  const getGradeColor = (grade: string) => {
    const colors: { [key: string]: string } = {
      '小班': 'blue',
      '中班': 'green',
      '大班': 'orange',
      '学前班': 'red'
    };
    return colors[grade] || 'default';
  };

  return (
    <div style={{ padding: '24px' }}>
      {/* 统计卡片 */}
      <Row gutter={16} style={{ marginBottom: '24px' }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="班级总数"
              value={stats.totalClasses}
              prefix={<TeamOutlined />}
            />
          </Card>
        </Col>
        {stats.gradeStats?.slice(0, 3).map((grade: any, index: number) => (
          <Col span={6} key={grade._id}>
            <Card>
              <Statistic
                title={grade._id}
                value={grade.count}
              />
            </Card>
          </Col>
        ))}
      </Row>

      {/* 操作栏 */}
      <Card style={{ marginBottom: '16px' }}>
        <Row gutter={16} align="middle">
          <Col flex="auto">
            <Space>
              <Search
                placeholder="搜索班级名称或教室号"
                allowClear
                style={{ width: 300 }}
                onSearch={setSearchText}
                enterButton={<SearchOutlined />}
              />
              <Select
                placeholder="年级"
                allowClear
                style={{ width: 120 }}
                value={filters.grade || undefined}
                onChange={(value) => setFilters({ ...filters, grade: value || '' })}
              >
                <Option value="小班">小班</Option>
                <Option value="中班">中班</Option>
                <Option value="大班">大班</Option>
                <Option value="学前班">学前班</Option>
              </Select>
              <Select
                placeholder="学年"
                allowClear
                style={{ width: 120 }}
                value={filters.academicYear || undefined}
                onChange={(value) => setFilters({ ...filters, academicYear: value || '' })}
              >
                <Option value="2023-2024">2023-2024</Option>
                <Option value="2024-2025">2024-2025</Option>
                <Option value="2025-2026">2025-2026</Option>
              </Select>
              <Select
                placeholder="学期"
                allowClear
                style={{ width: 100 }}
                value={filters.semester || undefined}
                onChange={(value) => setFilters({ ...filters, semester: value || '' })}
              >
                <Option value="spring">春季</Option>
                <Option value="fall">秋季</Option>
              </Select>
            </Space>
          </Col>
          <Col>
            <Space>
              <Button
                icon={<ReloadOutlined />}
                onClick={() => {
                  fetchClasses();
                  fetchStats();
                }}
              >
                刷新
              </Button>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  setEditingClass(null);
                  form.resetFields();
                  setModalVisible(true);
                }}
              >
                添加班级
              </Button>
            </Space>
          </Col>
        </Row>
      </Card>

      {/* 班级表格 */}
      <Card>
        <Table
          columns={columns}
          dataSource={classes}
          rowKey="_id"
          loading={loading}
          pagination={{
            total: classes.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
          scroll={{ x: 1200 }}
        />
      </Card>

      {/* 添加/编辑班级模态框 */}
      <Modal
        title={editingClass ? '编辑班级' : '添加班级'}
        open={modalVisible}
        onCancel={() => {
          setModalVisible(false);
          setEditingClass(null);
          form.resetFields();
        }}
        footer={null}
        width={600}
        destroyOnClose
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          initialValues={{
            status: 'active',
            semester: 'fall',
            academicYear: '2024-2025'
          }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="班级名称"
                rules={[{ required: true, message: '请输入班级名称' }]}
              >
                <Input placeholder="请输入班级名称" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="grade"
                label="年级"
                rules={[{ required: true, message: '请选择年级' }]}
              >
                <Select placeholder="请选择年级">
                  <Option value="小班">小班</Option>
                  <Option value="中班">中班</Option>
                  <Option value="大班">大班</Option>
                  <Option value="学前班">学前班</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="capacity"
                label="班级容量"
                rules={[{ required: true, message: '请输入班级容量' }]}
              >
                <InputNumber
                  style={{ width: '100%' }}
                  placeholder="请输入班级容量"
                  min={1}
                  max={50}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="academicYear"
                label="学年"
                rules={[{ required: true, message: '请选择学年' }]}
              >
                <Select placeholder="请选择学年">
                  <Option value="2023-2024">2023-2024</Option>
                  <Option value="2024-2025">2024-2025</Option>
                  <Option value="2025-2026">2025-2026</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="semester"
                label="学期"
                rules={[{ required: true, message: '请选择学期' }]}
              >
                <Select placeholder="请选择学期">
                  <Option value="spring">春季</Option>
                  <Option value="fall">秋季</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name={['classroom', 'number']}
                label="教室号"
                rules={[{ required: true, message: '请输入教室号' }]}
              >
                <Input placeholder="请输入教室号" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name={['classroom', 'building']}
                label="教学楼"
              >
                <Input placeholder="请输入教学楼" />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="班级描述"
          >
            <Input.TextArea rows={3} placeholder="请输入班级描述" />
          </Form.Item>

          <Form.Item style={{ textAlign: 'right', marginBottom: 0 }}>
            <Space>
              <Button onClick={() => setModalVisible(false)}>
                取消
              </Button>
              <Button type="primary" htmlType="submit">
                {editingClass ? '更新' : '添加'}
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 学生管理模态框 */}
      <Modal
        title={`管理学生 - ${selectedClass?.name}`}
        open={studentModalVisible}
        onCancel={() => setStudentModalVisible(false)}
        onOk={handleSaveStudents}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Transfer
          dataSource={transferData}
          targetKeys={targetKeys}
          onChange={(targetKeys) => setTargetKeys(targetKeys as string[])}
          render={(item) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={item.avatar} size="small" style={{ marginRight: 8 }} />
              <div>
                <div>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.description}</div>
              </div>
            </div>
          )}
          titles={['可选学生', '班级学生']}
          showSearch
          listStyle={{ width: 350, height: 400 }}
        />
      </Modal>

      {/* 教师管理模态框 */}
      <Modal
        title={`管理教师 - ${selectedClass?.name}`}
        open={teacherModalVisible}
        onCancel={() => setTeacherModalVisible(false)}
        onOk={handleSaveTeachers}
        width={800}
        okText="保存"
        cancelText="取消"
      >
        <Transfer
          dataSource={transferData}
          targetKeys={targetKeys}
          onChange={(targetKeys) => setTargetKeys(targetKeys as string[])}
          render={(item) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <Avatar src={item.avatar} size="small" style={{ marginRight: 8 }} />
              <div>
                <div>{item.title}</div>
                <div style={{ fontSize: '12px', color: '#666' }}>{item.description}</div>
              </div>
            </div>
          )}
          titles={['可选教师', '班级教师']}
          showSearch
          listStyle={{ width: 350, height: 400 }}
        />
      </Modal>
    </div>
  );
};

export default Classes;