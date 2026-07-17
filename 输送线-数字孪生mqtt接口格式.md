## 一、 参数字段详细说明

### 1. 基础信息
| 字段名           | 数据类型 | 必填 | 示例值                        | 说明                                                     |
| :--------------- | :------- | :--- | :---------------------------- | :------------------------------------------------------- |
| `timestamp`      | String   | 是   | `"2026-07-11T14:15:00+08:00"` | 时间                                                     |
| `motors`         | Array    | 是   | `[...]`                       | 电机数据列表，固定包含 32 个电机对象（1号 ~ 32号）。     |
| `sorting_chutes` | Array    | 是   | `[...]`                       | 分拣口数据列表，固定包含 13 个分拣口对象（1号 ~ 13号）。 |

### 2. 电机数据对象 (`motors` 数组元素)
| 字段名           | 数据类型    | 必填 | 范围约束        | 说明                                                         |
| :--------------- | :---------- | :--- | :-------------- | :----------------------------------------------------------- |
| `motor_id`       | Integer     | 是   | `1 ~ 32`        | 电机的唯一编号。                                             |
| `running_signal` | Integer     | 是   | `0` 或 `1`      | 电机运行状态信号：`0` 表示停止，`1` 表示运行。               |
| `large_bag_no`   | String/Null | 是   | 字符串或 `null` | **核心业务规则**：<br>1. 当 `motor_id` 在 `7 ~ 20` 范围内时，该字段为当前关联的大包号字符串（如 `"BG-20260711-007"`）。<br>2. 当 `motor_id` 为其他编号（`1~6` 或 `21~32`）时，该字段**固定为 `null`**。 |

### 3. 分拣口数据对象 (`sorting_chutes` 数组元素)
| 字段名          | 数据类型 | 必填 | 范围约束 | 说明                                           |
| :-------------- | :------- | :--- | :------- | :--------------------------------------------- |
| `chute_id`      | Integer  | 是   | `1 ~ 13` | 分拣口的唯一编号。                             |
| `package_count` | Integer  | 是   | `≥ 0`    | 该分拣口当前已收集或待处理的包裹数量（整数）。 |
| `large_bag_no`  | String   | 是   | 字符串   | 该分拣口当前正在集包/绑定的目标大包号。        |

---

## 二、 完整 JSON 报文示例

```json
{
  "timestamp": "2026-07-11T14:15:00+08:00",
  "motors": [
    { "motor_id": 1, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 2, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 3, "running_signal": 0, "large_bag_no": null },
    { "motor_id": 4, "running_signal": 0, "large_bag_no": null },
    { "motor_id": 5, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 6, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 7, "running_signal": 1, "large_bag_no": "BG-20260711-007" },
    { "motor_id": 8, "running_signal": 1, "large_bag_no": "BG-20260711-008" },
    { "motor_id": 9, "running_signal": 0, "large_bag_no": "BG-20260711-009" },
    { "motor_id": 10, "running_signal": 1, "large_bag_no": "BG-20260711-010" },
    { "motor_id": 11, "running_signal": 1, "large_bag_no": "BG-20260711-011" },
    { "motor_id": 12, "running_signal": 0, "large_bag_no": "BG-20260711-012" },
    { "motor_id": 13, "running_signal": 1, "large_bag_no": "BG-20260711-013" },
    { "motor_id": 14, "running_signal": 1, "large_bag_no": "BG-20260711-014" },
    { "motor_id": 15, "running_signal": 1, "large_bag_no": "BG-20260711-015" },
    { "motor_id": 16, "running_signal": 0, "large_bag_no": "BG-20260711-016" },
    { "motor_id": 17, "running_signal": 1, "large_bag_no": "BG-20260711-017" },
    { "motor_id": 18, "running_signal": 1, "large_bag_no": "BG-20260711-018" },
    { "motor_id": 19, "running_signal": 1, "large_bag_no": "BG-20260711-019" },
    { "motor_id": 20, "running_signal": 0, "large_bag_no": "BG-20260711-020" },
    { "motor_id": 21, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 22, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 23, "running_signal": 0, "large_bag_no": null },
    { "motor_id": 24, "running_signal": 0, "large_bag_no": null },
    { "motor_id": 25, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 26, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 27, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 28, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 29, "running_signal": 0, "large_bag_no": null },
    { "motor_id": 30, "running_signal": 0, "large_bag_no": null },
    { "motor_id": 31, "running_signal": 1, "large_bag_no": null },
    { "motor_id": 32, "running_signal": 1, "large_bag_no": null }
  ],
  "sorting_chutes": [
    { "chute_id": 1, "package_count": 5, "large_bag_no": "BG-20260711-101" },
    { "chute_id": 2, "package_count": 4, "large_bag_no": "BG-20260711-102" },
    { "chute_id": 3, "package_count": 5, "large_bag_no": "BG-20260711-103" },
    { "chute_id": 4, "package_count": 3, "large_bag_no": "BG-20260711-104" },
    { "chute_id": 5, "package_count": 0, "large_bag_no": "" },
    { "chute_id": 6, "package_count": 0, "large_bag_no": "" },
    { "chute_id": 7, "package_count": 0, "large_bag_no": "" },
    { "chute_id": 8, "package_count": 0, "large_bag_no": "" },
    { "chute_id": 9, "package_count": 0, "large_bag_no": "" },
    { "chute_id": 10, "package_count": 0, "large_bag_no": "" },
    { "chute_id": 11, "package_count": 5, "large_bag_no": "BG-20260711-111" },
    { "chute_id": 12, "package_count": 0, "large_bag_no": "" },
    { "chute_id": 13, "package_count": 0, "large_bag_no": "" }
  ]
}
```