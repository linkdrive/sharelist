import { ref, Ref, defineComponent, watchEffect, toRaw, reactive, UnwrapRef, watch } from 'vue'
import { useSetting } from '@/hooks/useSetting'
import { Switch, Modal, Input, Form, Button, Select, Tooltip } from 'ant-design-vue'
import { useObject } from '@/hooks/useHooks'
import { QuestionCircleOutlined } from '@ant-design/icons-vue'
import './index.less'

const { Item: FormItem, useForm } = Form

type FormState = {
  protocol: string
  name: string
  [key: string]: string | undefined
}

const getFitDriver = (protocol: string | undefined, drivers: Array<Driver>) => {
  const hit = drivers.find((i) => i.protocol == protocol)
  if (hit) {
    return hit
  }
}

const convBoolean = (v: string) => {
  return v === 'true' ? true : false
}

const parseFields = (
  fields: Array<DriverField>,
  formState: FormState,
  defaultValues: any,
  formItemsNode: any = [],
  innerRule: any = [],
): any => {
  for (const i of fields) {
    formState[i.key] = i.value === undefined ? (i.type == 'boolean' ? convBoolean(defaultValues[i.key]) : defaultValues[i.key]) : i.value

    if (i.required) {
      innerRule[i.key] = [{ required: true, message: '必填项 / required' }]
    }

    if (i.options) {
      formItemsNode.push(
        <FormItem name={i.key}>
          {{
            label: () => <div class="flex">{i.label}{i.help ? <Tooltip title={i.help}><QuestionCircleOutlined style={{ marginLeft: '8px', 'fontSize': '13px' }} /></Tooltip> : null} </div>,
            default: () => <Select v-model={[formState[i.key], 'value']} options={i.options} />
          }}
        </FormItem>,
      )
      if (i.fields) {
        const hitVal = formState[i.key]
        const hitIndex = i.options?.findIndex((i) => i.value == hitVal) || 0
        const hitField = (i.fields[hitIndex] as any) || []
        // console.log(i.options, formState, hitVal, hitField, 'hitField')
        parseFields(hitField, formState, defaultValues, formItemsNode, innerRule)
      }
    } else if (i.type == 'boolean') {
      formItemsNode.push(
        <FormItem name={i.key} >
          {{
            label: () => <div class="flex">{i.label}{i.help ? <Tooltip title={i.help}><QuestionCircleOutlined style={{ marginLeft: '8px', 'fontSize': '13px' }} /></Tooltip> : null} </div>,
            default: () => <Switch v-model={[formState[i.key], 'checked']} />
          }}
        </FormItem>,
      )
      if (i.fields) {
        const isTrue = formState[i.key]
        if (isTrue) {
          parseFields(i.fields, formState, defaultValues, formItemsNode, innerRule)
        }
      }
    } else if (i.type != 'hidden') {
      formItemsNode.push(
        <FormItem name={i.key}>
          {{
            label: () => <div class="flex">{i.label}{i.help ? <Tooltip title={i.help}><QuestionCircleOutlined style={{ marginLeft: '8px', 'fontSize': '13px' }} /></Tooltip> : null} </div>,
            default: () => <Input v-model={[formState[i.key], 'value']} />
          }}
        </FormItem>,
      )
    }
  }
  return [formItemsNode, innerRule]
}
export default defineComponent({
  props: {
    defaultValue: {
      type: Object,
      required: true,
    },
  },
  emits: ['update'],

  setup(props, ctx) {
    const { config } = useSetting()

    const formRef = ref()

    const drivers: Array<Driver> = [
      ...config.drivers,
    ]

    // const [rules, clearRules] = useObject()
    const driverTypes = drivers.map((i: Driver) => ({ value: i.protocol, label: i.name }))

    const [formState, clearFormState]: [UnwrapRef<FormState>, any] = useObject({
      name: props.defaultValue.name,
      protocol: props.defaultValue.protocol,
      id: props.defaultValue.id
    })

    const rules: Ref<any> = ref({})

    const formItems: Ref<any> = ref([])

    const onSave = () => {
      formRef.value
        .validate()
        .then(() => {
          const { name, id, protocol, ...config } = toRaw(formState)
          ctx.emit('update', { name, id, protocol, config })
        })
        .catch((err: any) => {
          console.log('error', err)
        })
    }

    watch(
      () => formState.protocol,
      () => {
        clearFormState(['protocol', 'name'])
      },
    )

    watchEffect(() => {
      const defaultValues = { ...toRaw(formState), ...props.defaultValue.config }

      formRef.value?.clearValidate()

      const innerRule = {
        name: [{ required: true, message: '必填项 / required' }],
        protocol: [{ required: true, message: '必填项 / required' }],
      }

      const formItemsNode = [
        <FormItem label="挂载类型 / protocol" name="protocol">
          <Select v-model={[formState.protocol, 'value']} options={driverTypes}></Select>
        </FormItem>,
        <FormItem label="挂载名称 / name" name="name">
          <Input v-model={[formState.name, 'value']} />
        </FormItem>,
      ]

      const driver = getFitDriver(formState.protocol, drivers)

      if (driver?.guide?.length) {
        const [nodes, rules] = parseFields(driver.guide, formState, defaultValues)
        if (nodes) {
          formItemsNode.push(...nodes)
        }
        if (rules) {
          Object.assign(innerRule, rules)
        }
      }

      formItems.value = formItemsNode
      rules.value = innerRule
    })

    return () => (
      <div class="modifier">
        <Form
          ref={(el: any) => (formRef.value = el)}
          class="fix-form--inline"
          layout="vertical"
          model={formState}
          rules={rules.value}
        >
          {formItems.value}
        </Form>
        <div class="modifier__footer">
          {config.guide[formState.protocol] ? (
            <a target="_blank" href={config.guide[formState.protocol]}>
              挂载向导
            </a>
          ) : <div></div>}
          <Button type="primary" onClick={onSave}>
            确定
          </Button>
        </div>
      </div>
    )
  },
})
