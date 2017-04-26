import React, {PropTypes, Component} from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import Dropdown from 'src/shared/components/Dropdown'
import LoadingDots from 'src/shared/components/LoadingDots'
import TemplateDrawer from 'src/shared/components/TemplateDrawer'
import {QUERY_TEMPLATES} from 'src/data_explorer/constants'
import {TEMPLATE_MATCHER} from 'src/dashboards/constants'

class QueryEditor extends Component {
  constructor(props) {
    super(props)
    this.state = {
      value: this.props.query,
      isTemplating: false,
      selectedTemplate: {
        tempVar: _.get(this.props.templates, ['0', 'tempVar'], ''),
      },
      filteredTemplates: this.props.templates,
    }

    this.handleKeyDown = ::this.handleKeyDown
    this.handleChange = ::this.handleChange
    this.handleUpdate = ::this.handleUpdate
    this.handleChooseTemplate = ::this.handleChooseTemplate
    this.handleCloseDrawer = ::this.handleCloseDrawer
    this.findTempVar = ::this.findTempVar
    this.handleTemplateReplace = ::this.handleTemplateReplace
    this.handleMouseOverTempVar = ::this.handleMouseOverTempVar
    this.handleClickTempVar = ::this.handleClickTempVar
    this.closeDrawer = ::this.closeDrawer
  }

  componentWillReceiveProps(nextProps) {
    if (this.props.query !== nextProps.query) {
      this.setState({value: nextProps.query})
    }
  }

  handleCloseDrawer() {
    this.setState({isTemplating: false})
  }

  handleMouseOverTempVar(template) {
    this.handleTemplateReplace(template)
  }

  handleClickTempVar(template) {
    // Clicking a tempVar does the same thing as hitting 'Enter'
    this.handleTemplateReplace(template, 'Enter')
    this.closeDrawer()
  }

  closeDrawer() {
    this.setState({
      isTemplating: false,
      selectedTemplate: {
        tempVar: _.get(this.props.templates, ['0', 'tempVar'], ''),
      },
    })
  }

  handleKeyDown(e) {
    const {isTemplating, value} = this.state

    if (isTemplating) {
      switch (e.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          e.preventDefault()
          return this.handleTemplateReplace(this.findTempVar('next'))
        case 'ArrowLeft':
        case 'ArrowUp':
          e.preventDefault()
          return this.handleTemplateReplace(this.findTempVar('previous'))
        case 'Enter':
          e.preventDefault()
          this.handleTemplateReplace(this.state.selectedTemplate, e.key)
          return this.closeDrawer()
        case 'Escape':
          e.preventDefault()
          return this.closeDrawer()
      }
    } else if (e.key === 'Escape') {
      e.preventDefault()
      this.setState({value, isTemplating: false})
    } else if (e.key === 'Enter') {
      e.preventDefault()
      this.handleUpdate()
    }
  }

  handleTemplateReplace(selectedTemplate, key) {
    const {selectionStart, value} = this.editor
    const {tempVar} = selectedTemplate

    let templatedValue
    const prefix = key === 'Enter' ? '' : ':'
    const matched = value.match(TEMPLATE_MATCHER)
    if (matched) {
      templatedValue = value.replace(TEMPLATE_MATCHER, `${prefix}${tempVar}`)
    }

    const diffInLength = tempVar.length - matched[0].length

    this.setState({value: templatedValue, selectedTemplate}, () =>
      this.editor.setSelectionRange(
        selectionStart + diffInLength + 1,
        selectionStart + diffInLength + 1
      )
    )
  }

  findTempVar(direction) {
    const {filteredTemplates: templates} = this.state
    const {selectedTemplate} = this.state

    const i = _.findIndex(templates, selectedTemplate)
    const lastIndex = templates.length - 1

    if (i >= 0) {
      if (direction === 'next') {
        return templates[(i + 1) % templates.length]
      }

      if (direction === 'previous') {
        if (i === 0) {
          return templates[lastIndex]
        }

        return templates[i - 1]
      }
    }

    return templates[0]
  }

  handleChange() {
    const {templates} = this.props
    const {selectedTemplate} = this.state
    const value = this.editor.value
    const matches = value.match(TEMPLATE_MATCHER)
    if (matches) {
      // maintain cursor poition
      const start = this.editor.selectionStart
      const end = this.editor.selectionEnd
      const filteredTemplates = templates.filter(t =>
        t.tempVar.includes(matches[0].substring(1))
      )

      const found = filteredTemplates.find(
        t => t.tempVar === selectedTemplate && selectedTemplate.tempVar
      )
      const newTemplate = found ? found : filteredTemplates[0]

      this.setState({
        isTemplating: true,
        selectedTemplate: newTemplate,
        filteredTemplates,
        value,
      })
      this.editor.setSelectionRange(start, end)
    } else {
      this.setState({isTemplating: false, value})
    }
  }

  handleUpdate() {
    this.props.onUpdate(this.state.value)
  }

  handleChooseTemplate(template) {
    this.setState({value: template.query})
  }

  handleSelectTempVar(tempVar) {
    this.setState({selectedTemplate: tempVar})
  }

  render() {
    const {config: {status}} = this.props
    const {
      value,
      isTemplating,
      selectedTemplate,
      filteredTemplates,
    } = this.state

    return (
      <div className="query-editor">
        {isTemplating
          ? <TemplateDrawer
              onClickTempVar={this.handleClickTempVar}
              templates={filteredTemplates}
              selected={selectedTemplate}
              onMouseOverTempVar={this.handleMouseOverTempVar}
              handleClickOutside={this.handleCloseDrawer}
            />
          : null}
        <textarea
          className="query-editor--field"
          onChange={this.handleChange}
          onKeyDown={this.handleKeyDown}
          onBlur={this.handleUpdate}
          ref={editor => (this.editor = editor)}
          value={value}
          placeholder="Enter a query or select database, measurement, and field below and have us build one for you..."
          autoComplete="off"
          spellCheck="false"
        />
        {this.renderStatus(status)}
        <Dropdown
          items={QUERY_TEMPLATES}
          selected={'Query Templates'}
          onChoose={this.handleChooseTemplate}
          className="query-editor--templates"
        />
      </div>
    )
  }

  renderStatus(status) {
    if (!status) {
      return <div className="query-editor--status" />
    }

    if (status.loading) {
      return (
        <div className="query-editor--status">
          <LoadingDots />
        </div>
      )
    }

    return (
      <div
        className={classNames('query-editor--status', {
          'query-editor--error': status.error,
          'query-editor--success': status.success,
          'query-editor--warning': status.warn,
        })}
      >
        <span
          className={classNames('icon', {
            stop: status.error,
            checkmark: status.success,
            'alert-triangle': status.warn,
          })}
        />
        {status.error || status.warn || status.success}
      </div>
    )
  }
}

const {arrayOf, func, shape, string} = PropTypes

QueryEditor.propTypes = {
  query: string.isRequired,
  onUpdate: func.isRequired,
  config: shape().isRequired,
  templates: arrayOf(
    shape({
      tempVar: string.isRequired,
    })
  ).isRequired,
}

export default QueryEditor
