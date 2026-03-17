import { useEffect, useState } from 'react';
import { Card, Form, Checkbox, Input, Slider, Select, Button, message, Space, Tag, Divider } from 'antd';
import { SaveOutlined, ReloadOutlined, DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useI18n } from '../i18n/i18n-config.jsx';
import { fetchRules, updateRules } from '../api/task-api-client.js';

// Ngày làm việc: T2=1 → CN=0
const ALL_DAYS = [
  { value: 1, label: 'T2' }, { value: 2, label: 'T3' }, { value: 3, label: 'T4' },
  { value: 4, label: 'T5' }, { value: 5, label: 'T6' }, { value: 6, label: 'T7' }, { value: 0, label: 'CN' },
];

const FALLBACK_OPTIONS = [
  { value: 'estTime_desc', label: 'Thời gian ước tính (giảm dần)' },
  { value: 'estTime_asc', label: 'Thời gian ước tính (tăng dần)' },
  { value: 'dueDate_asc', label: 'Deadline (sớm nhất trước)' },
];

export default function SettingsPage() {
  const { t } = useI18n();
  const [rules, setRules] = useState(null);
  const [loading, setLoading] = useState(false);
  const [newKeyword, setNewKeyword] = useState('');
  const [newRule, setNewRule] = useState({ field: 'game', contains: '', boost: -100 });

  const loadRules = () => {
    fetchRules().then(setRules).catch(() => message.error('Load rules failed'));
  };

  useEffect(() => { loadRules(); }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      const saved = await updateRules(rules);
      setRules(saved);
      message.success('Đã lưu cài đặt');
    } catch {
      message.error('Lưu thất bại');
    }
    setLoading(false);
  };

  if (!rules) return null;

  const addKeyword = () => {
    const kw = newKeyword.trim();
    if (!kw || rules.feedbackKeywords?.includes(kw)) return;
    setRules(r => ({ ...r, feedbackKeywords: [...(r.feedbackKeywords || []), kw] }));
    setNewKeyword('');
  };

  const removeKeyword = (kw) => {
    setRules(r => ({ ...r, feedbackKeywords: r.feedbackKeywords.filter(k => k !== kw) }));
  };

  const addPriorityRule = () => {
    if (!newRule.contains.trim()) return;
    setRules(r => ({ ...r, priorityRules: [...(r.priorityRules || []), { ...newRule, contains: newRule.contains.trim() }] }));
    setNewRule({ field: 'game', contains: '', boost: -100 });
  };

  const removePriorityRule = (idx) => {
    setRules(r => ({ ...r, priorityRules: r.priorityRules.filter((_, i) => i !== idx) }));
  };

  return (
    <div style={{ maxWidth: 700, margin: '0 auto' }}>
      <Space direction="vertical" size={16} style={{ width: '100%' }}>
        {/* Ngày làm việc */}
        <Card title="Ngày làm việc" size="small">
          <Checkbox.Group
            value={rules.workingDays}
            onChange={v => setRules(r => ({ ...r, workingDays: v }))}
            options={ALL_DAYS}
          />
          <div style={{ marginTop: 8, fontSize: 12, color: '#8c8c8c' }}>
            Chọn ngày làm việc để tính deadline tự động
          </div>
        </Card>

        {/* Feedback Keywords */}
        <Card title="Từ khóa Feedback" size="small">
          <div style={{ marginBottom: 8 }}>
            {rules.feedbackKeywords?.map(kw => (
              <Tag key={kw} closable onClose={() => removeKeyword(kw)} color="purple" style={{ marginBottom: 4 }}>
                {kw}
              </Tag>
            ))}
          </div>
          <Space.Compact style={{ width: 300 }}>
            <Input size="small" placeholder="Thêm từ khóa..." value={newKeyword}
              onChange={e => setNewKeyword(e.target.value)}
              onPressEnter={addKeyword} />
            <Button size="small" icon={<PlusOutlined />} onClick={addKeyword} />
          </Space.Compact>
          <Divider style={{ margin: '12px 0' }} />
          <div>
            <span style={{ fontSize: 13 }}>Ngưỡng tương đồng: </span>
            <strong>{rules.similarityThreshold}</strong>
          </div>
          <Slider min={0.1} max={1} step={0.05} value={rules.similarityThreshold}
            onChange={v => setRules(r => ({ ...r, similarityThreshold: v }))}
            style={{ maxWidth: 300 }} />
          <div style={{ fontSize: 12, color: '#8c8c8c' }}>
            Thấp = dễ match feedback với task, Cao = cần chính xác hơn
          </div>
        </Card>

        {/* Magic Input */}
        <Card title="Magic Input" size="small">
          <Form.Item label="Ký tự tách Game / Project" style={{ marginBottom: 8 }}>
            <Input size="small" value={rules.contextSeparator ?? ' - '} style={{ width: 100 }}
              onChange={e => setRules(r => ({ ...r, contextSeparator: e.target.value }))} />
          </Form.Item>
          <Form.Item label="Thời gian mặc định (không ghi)" style={{ marginBottom: 8 }}>
            <Space>
              <Input size="small" type="number" value={rules.defaultEstTime ?? 1} style={{ width: 60 }}
                onChange={e => setRules(r => ({ ...r, defaultEstTime: parseFloat(e.target.value) || 1 }))} />
              <Select size="small" value={rules.defaultEstUnit ?? 'd'} style={{ width: 70 }}
                onChange={v => setRules(r => ({ ...r, defaultEstUnit: v }))}
                options={[{ value: 'd', label: 'ngày' }, { value: 'h', label: 'giờ' }]} />
            </Space>
          </Form.Item>
          <Form.Item label="Placeholder hướng dẫn" style={{ marginBottom: 0 }}>
            <Input.TextArea size="small" rows={3} value={rules.magicPlaceholder ?? ''}
              onChange={e => setRules(r => ({ ...r, magicPlaceholder: e.target.value }))}
              placeholder="Để trống = dùng mặc định" />
          </Form.Item>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
            Cú pháp: Dòng context (Game{rules.contextSeparator ?? ' - '}Project), dòng task (TênTask {rules.defaultEstTime ?? 1}{rules.defaultEstUnit ?? 'd'})
          </div>
        </Card>

        {/* Priority Rules */}
        <Card title="Luật ưu tiên" size="small">
          {rules.priorityRules?.length > 0 && (
            <div style={{ marginBottom: 12 }}>
              {rules.priorityRules.map((rule, idx) => (
                <div key={idx} style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 4 }}>
                  <Tag color="blue">{rule.field}</Tag>
                  <span>chứa</span>
                  <Tag color="orange">{rule.contains}</Tag>
                  <span>→ boost: <strong>{rule.boost}</strong></span>
                  <Button size="small" danger icon={<DeleteOutlined />} onClick={() => removePriorityRule(idx)}
                    style={{ marginLeft: 'auto' }} />
                </div>
              ))}
            </div>
          )}
          <Space wrap>
            <Select size="small" value={newRule.field} style={{ width: 100 }}
              onChange={v => setNewRule(r => ({ ...r, field: v }))}
              options={[
                { value: 'game', label: 'Game' },
                { value: 'project', label: 'Project' },
                { value: 'name', label: 'Tên task' },
              ]} />
            <Input size="small" placeholder="chứa..." value={newRule.contains} style={{ width: 120 }}
              onChange={e => setNewRule(r => ({ ...r, contains: e.target.value }))} />
            <Input size="small" type="number" value={newRule.boost} style={{ width: 80 }}
              onChange={e => setNewRule(r => ({ ...r, boost: parseInt(e.target.value) || 0 }))}
              placeholder="boost" />
            <Button size="small" icon={<PlusOutlined />} onClick={addPriorityRule}>Thêm</Button>
          </Space>
          <div style={{ fontSize: 12, color: '#8c8c8c', marginTop: 8 }}>
            Boost âm = ưu tiên cao hơn. VD: game chứa "pusoy" → boost -100
          </div>
          <Divider style={{ margin: '12px 0' }} />
          <Form.Item label="Sắp xếp mặc định" style={{ marginBottom: 0 }}>
            <Select size="small" value={rules.prioritySortFallback} style={{ width: 280 }}
              onChange={v => setRules(r => ({ ...r, prioritySortFallback: v }))}
              options={FALLBACK_OPTIONS} />
          </Form.Item>
        </Card>

        {/* Actions */}
        <Space>
          <Button type="primary" icon={<SaveOutlined />} loading={loading} onClick={handleSave}>
            {t('common.save')}
          </Button>
          <Button icon={<ReloadOutlined />} onClick={loadRules}>Reset</Button>
        </Space>
      </Space>
    </div>
  );
}
