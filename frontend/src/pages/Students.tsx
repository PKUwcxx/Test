import React, { useEffect, useState } from 'react';
import {
  Table,
  Button,
  Input,
  Space,
  Tag,
  Avatar,
  Modal,
  Form,
  Select,
  DatePicker,
  Row,
  Col,
  Card,
  Typography,
  Popconfirm,
  message,
  Drawer,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined,
  UserOutlined,
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { Student, StudentForm } from '../types';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const { Title } = Typography;
const { Option } = Select;

const Students: React.FC = () => {
  const { hasRole } = useAuth();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isDetailVisible, setIsDetailVisible] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [form] = Form.useForm();

  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      // 这里应该调用实际的API，现在使用模拟数据
      const mockStudents: Student[] = [
        {
          id: '1',
          studentId: 'STU001',
          profile: {
            firstName: '小明',
            lastName: '张',
            gender: 'male',
            dateOfBirth: '2019-05-15',
            address: '北京市朝阳区xxx街道',
          },
          parents: [
            {
              user: {
                id: '1',
                username: 'parent1',
                email: 'parent1@example.com',
                role: 'parent',
                profile: {
                  firstName: '建国',
                  lastName: '张',
                  phone: '13800138001',
                },
                isActive: true,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
              relationship: 'father',
              isPrimary: true,
            },
          ],
          enrollmentDate: '2024-01-15',
          healthInfo: {
            allergies: ['花生', '海鲜'],
            emergencyContact: {
              name: '张建国',
              phone: '13800138001',
              relationship: '父亲',
            },
            bloodType: 'A',
          },
          academicInfo: {
            grade: '中班',
            status: 'active',
          },
          notes: [],
          fullName: '张小明',
          age: 4,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
        {
          id: '2',
          studentId: 'STU002',
          profile: {
            firstName: '小红',
            lastName: '李',
            gender: 'female',
            dateOfBirth: '2020-03-20',
            address: '北京市海淀区xxx路',
          },
          parents: [
            {
              user: {
                id: '2',
                username: 'parent2',
                email: 'parent2@example.com',
                role: 'parent',
                profile: {
                  firstName: '美丽',
                  lastName: '李',
                  phone: '13800138002',
                },
                isActive: true,
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z',
              },
              relationship: 'mother',
              isPrimary: true,
            },
          ],
          enrollmentDate: '2024-01-15',
          healthInfo: {
            allergies: [],
            emergencyContact: {
              name: '李美丽',
              phone: '13800138002',
              relationship: '母亲',
            },
            bloodType: 'B',
          },
          academicInfo: {
            grade: '小班',
            status: 'active',
          },
          notes: [],
          fullName: '李小红',
          age: 3,
          createdAt: '2024-01-15T00:00:00Z',
          updatedAt: '2024-01-15T00:00:00Z',
        },
      ];
      
      setTimeout(() => {
        setStudents(mockStudents);
        setLoading(false);
      }, 500);
    } catch (error) {
      console.error('获取学生列表失败:', error);
      setLoading(false);
    }
  };

  const handleAdd = () => {
    setEditingStudent(null);
    form.resetFields();
    setIsModalVisible(true);
  };

  const handleEdit = (student: Student) => {
    setEditingStudent(student);
    form.setFieldsValue({
      studentId: student.studentId,
      firstName: student.profile.firstName,
      lastName: student.profile.lastName,
      gender: student.profile.gender,
      dateOfBirth: dayjs(student.profile.dateOfBirth),
      address: student.profile.address,
      grade: student.academicInfo.grade,
      enrollmentDate: dayjs(student.enrollmentDate),
      bloodType: student.healthInfo.bloodType,
      allergies: student.healthInfo.allergies?.join(', '),
      emergencyContactName: student.healthInfo.emergencyContact?.name,
      emergencyContactPhone: student.healthInfo.emergencyContact?.phone,
      emergencyContactRelationship: student.healthInfo.emergencyContact?.relationship,
    });
    setIsModalVisible(true);
  };

  const handleDelete = async (id: string) => {
    try {
      // 这里应该调用实际的删除API
      setStudents(students.filter(student => student.id !== id));
      message.success('删除成功');
    } catch (error) {
      message.error('删除失败');
    }
  };

  const handleView = (student: Student) => {
    setSelectedStudent(student);
    setIsDetailVisible(true);
  };

  const handleSubmit = async (values: any) => {
    try {
      const studentData: StudentForm = {
        studentId: values.studentId,
        profile: {
          firstName: values.firstName,
          lastName: values.lastName,
          gender: values.gender,
          dateOfBirth: values.dateOfBirth.format('YYYY-MM-DD'),
          address: values.address,
        },
        enrollmentDate: values.enrollmentDate.format('YYYY-MM-DD'),
        healthInfo: {
          allergies: values.allergies ? values.allergies.split(',').map((item: string) => item.trim()) : [],
          emergencyContact: {
            name: values.emergencyContactName,
            phone: values.emergencyContactPhone,
            relationship: values.emergencyContactRelationship,
          },
          bloodType: values.bloodType,
        },
        academicInfo: {
          grade: values.grade,
          status: 'active',
        },
      };

      if (editingStudent) {
        // 更新学生
        message.success('更新成功');
      } else {
        // 添加学生
        message.success('添加成功');
      }

      setIsModalVisible(false);
      fetchStudents();
    } catch (error) {
      message.error(editingStudent ? '更新失败' : '添加失败');
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: 'green',
      inactive: 'orange',
      graduated: 'blue',
      transferred: 'purple',
    };
    return colors[status as keyof typeof colors] || 'default';
  };

  const getStatusText = (status: string) => {
    const texts = {
      active: '在读',
      inactive: '休学',
      graduated: '毕业',
      transferred: '转学',
    };
    return texts[status as keyof typeof texts] || status;
  };

  const columns: ColumnsType<Student> = [
    {
      title: '头像',
      dataIndex: ['profile', 'avatar'],
      key: 'avatar',
      width: 80,
      render: (avatar, record) => (
        <Avatar
          size={40}
          src={avatar}
          icon={<UserOutlined />}
          style={{ backgroundColor: record.profile.gender === 'male' ? '#1890ff' : '#f759ab' }}
        >
          {record.profile.firstName}
        </Avatar>
      ),
    },
    {
      title: '学号',
      dataIndex: 'studentId',
      key: 'studentId',
      width: 100,
    },
    {
      title: '姓名',
      dataIndex: 'fullName',
      key: 'fullName',
      width: 120,
    },
    {
      title: '性别',
      dataIndex: ['profile', 'gender'],
      key: 'gender',
      width: 80,
      render: (gender) => (
        <Tag color={gender === 'male' ? 'blue' : 'pink'}>
          {gender === 'male' ? '男' : '女'}
        </Tag>
      ),
    },
    {
      title: '年龄',
      dataIndex: 'age',
      key: 'age',
      width: 80,
      render: (age) => `${age}岁`,
    },
    {
      title: '班级',
      dataIndex: ['academicInfo', 'grade'],
      key: 'grade',
      width: 100,
    },
    {
      title: '状态',
      dataIndex: ['academicInfo', 'status'],
      key: 'status',
      width: 100,
      render: (status) => (
        <Tag color={getStatusColor(status)}>
          {getStatusText(status)}
        </Tag>
      ),
    },
    {
      title: '入学日期',
      dataIndex: 'enrollmentDate',
      key: 'enrollmentDate',
      width: 120,
      render: (date) => dayjs(date).format('YYYY-MM-DD'),
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_, record) => (
        <Space size="small">
          <Button
            type="link"
            icon={<EyeOutlined />}
            onClick={() => handleView(record)}
          >
            查看
          </Button>
          {hasRole(['admin', 'teacher']) && (
            <>
              <Button
                type="link"
                icon={<EditOutlined />}
                onClick={() => handleEdit(record)}
              >
                编辑
              </Button>
              {hasRole(['admin']) && (
                <Popconfirm
                  title="确定要删除这个学生吗？"
                  onConfirm={() => handleDelete(record.id)}
                  okText="确定"
                  cancelText="取消"
                >
                  <Button
                    type="link"
                    danger
                    icon={<DeleteOutlined />}
                  >
                    删除
                  </Button>
                </Popconfirm>
              )}
            </>
          )}
        </Space>
      ),
    },
  ];

  const filteredStudents = students.filter(student =>
    student.fullName.toLowerCase().includes(searchText.toLowerCase()) ||
    student.studentId.toLowerCase().includes(searchText.toLowerCase())
  );

  return (
    <div>
      <div className="page-header">
        <Title level={2} className="page-title">学生管理</Title>
      </div>

      <Card>
        <div className="table-toolbar">
          <Input
            placeholder="搜索学生姓名或学号"
            prefix={<SearchOutlined />}
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            className="table-search"
          />
          {hasRole(['admin', 'teacher']) && (
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={handleAdd}
            >
              添加学生
            </Button>
          )}
        </div>

        <Table
          columns={columns}
          dataSource={filteredStudents}
          rowKey="id"
          loading={loading}
          pagination={{
            total: filteredStudents.length,
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total) => `共 ${total} 条记录`,
          }}
        />
      </Card>

      {/* 添加/编辑学生模态框 */}
      <Modal
        title={editingStudent ? '编辑学生' : '添加学生'}
        open={isModalVisible}
        onCancel={() => setIsModalVisible(false)}
        footer={null}
        width={800}
      >
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="studentId"
                label="学号"
                rules={[{ required: true, message: '请输入学号' }]}
              >
                <Input placeholder="请输入学号" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="lastName"
                label="姓"
                rules={[{ required: true, message: '请输入姓' }]}
              >
                <Input placeholder="请输入姓" />
              </Form.Item>
            </Col>
            <Col span={6}>
              <Form.Item
                name="firstName"
                label="名"
                rules={[{ required: true, message: '请输入名' }]}
              >
                <Input placeholder="请输入名" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="gender"
                label="性别"
                rules={[{ required: true, message: '请选择性别' }]}
              >
                <Select placeholder="请选择性别">
                  <Option value="male">男</Option>
                  <Option value="female">女</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="dateOfBirth"
                label="出生日期"
                rules={[{ required: true, message: '请选择出生日期' }]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="grade"
                label="班级"
                rules={[{ required: true, message: '请选择班级' }]}
              >
                <Select placeholder="请选择班级">
                  <Option value="小班">小班</Option>
                  <Option value="中班">中班</Option>
                  <Option value="大班">大班</Option>
                  <Option value="学前班">学前班</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="address"
            label="家庭地址"
          >
            <Input placeholder="请输入家庭地址" />
          </Form.Item>

          <Form.Item
            name="enrollmentDate"
            label="入学日期"
            rules={[{ required: true, message: '请选择入学日期' }]}
          >
            <DatePicker style={{ width: '100%' }} />
          </Form.Item>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="bloodType"
                label="血型"
              >
                <Select placeholder="请选择血型">
                  <Option value="A">A型</Option>
                  <Option value="B">B型</Option>
                  <Option value="AB">AB型</Option>
                  <Option value="O">O型</Option>
                </Select>
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item
                name="allergies"
                label="过敏史"
              >
                <Input placeholder="请输入过敏史，多个用逗号分隔" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={8}>
              <Form.Item
                name="emergencyContactName"
                label="紧急联系人"
              >
                <Input placeholder="请输入紧急联系人姓名" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="emergencyContactPhone"
                label="联系电话"
              >
                <Input placeholder="请输入联系电话" />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item
                name="emergencyContactRelationship"
                label="关系"
              >
                <Select placeholder="请选择关系">
                  <Option value="父亲">父亲</Option>
                  <Option value="母亲">母亲</Option>
                  <Option value="爷爷">爷爷</Option>
                  <Option value="奶奶">奶奶</Option>
                  <Option value="外公">外公</Option>
                  <Option value="外婆">外婆</Option>
                  <Option value="其他">其他</Option>
                </Select>
              </Form.Item>
            </Col>
          </Row>

          <Form.Item>
            <Space>
              <Button type="primary" htmlType="submit">
                {editingStudent ? '更新' : '添加'}
              </Button>
              <Button onClick={() => setIsModalVisible(false)}>
                取消
              </Button>
            </Space>
          </Form.Item>
        </Form>
      </Modal>

      {/* 学生详情抽屉 */}
      <Drawer
        title="学生详情"
        placement="right"
        onClose={() => setIsDetailVisible(false)}
        open={isDetailVisible}
        width={600}
      >
        {selectedStudent && (
          <div>
            <Card title="基本信息" style={{ marginBottom: 16 }}>
              <Row gutter={16}>
                <Col span={24} style={{ textAlign: 'center', marginBottom: 16 }}>
                  <Avatar
                    size={80}
                    src={selectedStudent.profile.avatar}
                    icon={<UserOutlined />}
                    style={{ backgroundColor: selectedStudent.profile.gender === 'male' ? '#1890ff' : '#f759ab' }}
                  >
                    {selectedStudent.profile.firstName}
                  </Avatar>
                  <Title level={4} style={{ marginTop: 8 }}>
                    {selectedStudent.fullName}
                  </Title>
                </Col>
              </Row>
              <Row gutter={16}>
                <Col span={12}>
                  <p><strong>学号：</strong>{selectedStudent.studentId}</p>
                  <p><strong>性别：</strong>{selectedStudent.profile.gender === 'male' ? '男' : '女'}</p>
                  <p><strong>年龄：</strong>{selectedStudent.age}岁</p>
                </Col>
                <Col span={12}>
                  <p><strong>班级：</strong>{selectedStudent.academicInfo.grade}</p>
                  <p><strong>状态：</strong>
                    <Tag color={getStatusColor(selectedStudent.academicInfo.status)}>
                      {getStatusText(selectedStudent.academicInfo.status)}
                    </Tag>
                  </p>
                  <p><strong>入学日期：</strong>{dayjs(selectedStudent.enrollmentDate).format('YYYY-MM-DD')}</p>
                </Col>
              </Row>
              <p><strong>出生日期：</strong>{dayjs(selectedStudent.profile.dateOfBirth).format('YYYY-MM-DD')}</p>
              <p><strong>家庭地址：</strong>{selectedStudent.profile.address}</p>
            </Card>

            <Card title="健康信息" style={{ marginBottom: 16 }}>
              <p><strong>血型：</strong>{selectedStudent.healthInfo.bloodType || '未填写'}</p>
              <p><strong>过敏史：</strong>
                {selectedStudent.healthInfo.allergies && selectedStudent.healthInfo.allergies.length > 0
                  ? selectedStudent.healthInfo.allergies.join('、')
                  : '无'
                }
              </p>
              {selectedStudent.healthInfo.emergencyContact && (
                <div>
                  <p><strong>紧急联系人：</strong></p>
                  <ul>
                    <li>姓名：{selectedStudent.healthInfo.emergencyContact.name}</li>
                    <li>电话：{selectedStudent.healthInfo.emergencyContact.phone}</li>
                    <li>关系：{selectedStudent.healthInfo.emergencyContact.relationship}</li>
                  </ul>
                </div>
              )}
            </Card>

            <Card title="家长信息">
              {selectedStudent.parents.map((parent, index) => (
                <div key={index} style={{ marginBottom: 16 }}>
                  <p><strong>家长 {index + 1}：</strong></p>
                  <ul>
                    <li>姓名：{parent.user.profile.firstName} {parent.user.profile.lastName}</li>
                    <li>关系：{parent.relationship === 'father' ? '父亲' : parent.relationship === 'mother' ? '母亲' : '监护人'}</li>
                    <li>电话：{parent.user.profile.phone}</li>
                    <li>邮箱：{parent.user.email}</li>
                    {parent.isPrimary && <li><Tag color="blue">主要联系人</Tag></li>}
                  </ul>
                </div>
              ))}
            </Card>
          </div>
        )}
      </Drawer>
    </div>
  );
};

export default Students;