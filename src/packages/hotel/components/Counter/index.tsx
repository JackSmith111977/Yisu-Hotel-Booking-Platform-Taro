import React from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface CounterProps {
  value: number
  min?: number
  max?: number
  onChange: (value: number) => void
}

const Counter: React.FC<CounterProps> = ({ value, min = 1, max = 10, onChange }) => {
  const isMin = value <= min
  const isMax = value >= max
  const safeValue = Math.max(value, min)

  return (
    <View className='counter'>
      <Text
        className={`counter-btn ${isMin ? 'counter-btn--disabled' : ''}`}
        onClick={() => !isMin && onChange(value - 1)}
      >
        −
      </Text>
      <Text className='counter-value'>{safeValue}</Text>
      <Text
        className={`counter-btn ${isMax ? 'counter-btn--disabled' : ''}`}
        onClick={() => !isMax && onChange(value + 1)}
      >
        +
      </Text>
    </View>
  )
}

export default Counter