import counterpart from 'counterpart';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import TetherComponent from 'react-tether';

import keymap from '../../shortcuts/keymap';
import OverlayField from '../app/OverlayField';
import ModalContextShortcuts from '../keyshortcuts/ModalContextShortcuts';
import Tooltips from '../tooltips/Tooltips.js';
import RawWidget from '../widget/RawWidget';
import {
  openFilterBox,
  closeFilterBox,
  parseDateWithCurrenTimezone,
} from '../../actions/WindowActions';
import { DATE_FIELDS } from '../../constants/Constants';
class FiltersItem extends Component {
  constructor(props) {
    super(props);

    this.state = {
      filter: props.data,
      isTooltipShow: false,
    };
  }

  componentWillMount() {
    this.init();
  }

  componentWillReceiveProps(props) {
    const { active } = this.props;

    if (JSON.stringify(active) !== JSON.stringify(props.active)) {
      this.init();
    }
  }

  componentDidMount() {
    if (this.widgetsContainer) {
      this.widgetsContainer.addEventListener('scroll', this.handleScroll);
    }
  }

  componentWillUnmount() {
    const { dispatch } = this.props;

    if (this.widgetsContainer) {
      this.widgetsContainer.removeEventListener('scroll', this.handleScroll);
    }

    dispatch(closeFilterBox());
  }

  init = () => {
    const { active, data } = this.props;
    const { filter } = this.state;
    let activeFilter;

    if (active) {
      activeFilter = active.find(item => item.filterId === data.filterId);
    }

    if (
      filter.parameters &&
      activeFilter &&
      activeFilter.parameters &&
      activeFilter.filterId === filter.filterId
    ) {
      activeFilter.parameters.map(item => {
        this.mergeData(
          item.parameterName,
          item.value != null ? item.value : '',
          item.valueTo != null ? item.valueTo : ''
        );
      });
    } else if (filter.parameters) {
      filter.parameters.map(item => {
        this.mergeData(item.parameterName, '');
      });
    }
  };

  setValue = (property, value, id, valueTo) => {
    //TODO: LOOKUPS GENERATE DIFFERENT TYPE OF PROPERTY parameters
    // IT HAS TO BE UNIFIED
    //
    // OVERWORKED WORKAROUND
    if (Array.isArray(property)) {
      property.map(item => {
        this.mergeData(item.parameterName, value, valueTo);
      });
    } else {
      this.mergeData(property, value, valueTo);
    }
  };

  // TODO: Fix the timezone issue
  // Right now, it's ignoring the returning timezone from back-end
  // and use the browser's default timezone
  parseDateToReadable = (widgetType, value) => {
    if (DATE_FIELDS.indexOf(widgetType) > -1) {
      return parseDateWithCurrenTimezone(value);
    }
    return value;
  };

  mergeData = (property, value, valueTo) => {
    this.setState(prevState => ({
      filter: Object.assign({}, prevState.filter, {
        parameters: prevState.filter.parameters.map(param => {
          if (param.parameterName === property) {
            return Object.assign({}, param, {
              value: this.parseDateToReadable(param.widgetType, value),
              valueTo: this.parseDateToReadable(param.widgetType, valueTo),
            });
          } else {
            return param;
          }
        }),
      }),
    }));
  };

  handleScroll = () => {
    const { dispatch } = this.props;
    const {
      top,
      left,
      bottom,
      right,
    } = this.widgetsContainer.getBoundingClientRect();
    dispatch(openFilterBox({ top, left, bottom, right }));
  };

  handleApply = () => {
    const { applyFilters, closeFilterMenu } = this.props;
    const { filter } = this.state;

    if (
      filter &&
      filter.parametersLayoutType === 'singleOverlayField' &&
      !filter.parameters[0].value
    ) {
      return this.handleClear();
    }

    applyFilters(filter, () => {
      closeFilterMenu();
    });
  };

  handleClear = () => {
    const { clearFilters, closeFilterMenu, returnBackToDropdown } = this.props;
    const { filter } = this.state;

    clearFilters(filter);
    closeFilterMenu();
    returnBackToDropdown && returnBackToDropdown();
  };

  toggleTooltip = visible => {
    this.setState({
      isTooltipShow: visible,
    });
  };

  render() {
    const {
      data,
      notValidFields,
      isActive,
      windowType,
      onShow,
      onHide,
      viewId,
      outsideClick,
      captionValue,
    } = this.props;

    const { filter, isTooltipShow } = this.state;

    return (
      <div>
        {data.parametersLayoutType === 'singleOverlayField' ? (
          <OverlayField
            type={windowType}
            filter
            captionValue={captionValue}
            layout={filter}
            handlePatch={this.setValue}
            handleChange={this.setValue}
            closeOverlay={outsideClick}
            handleSubmit={this.handleApply}
            {...{ windowType, onShow, onHide, viewId }}
          />
        ) : (
          <div
            className="filter-menu filter-widget"
            ref={c => (this.widgetsContainer = c)}
          >
            <div>
              {counterpart.translate('window.activeFilter.caption')}:
              <span className="filter-active">{data.caption}</span>
              {isActive && (
                <span
                  className="filter-clear"
                  onClick={() => this.handleClear()}
                >
                  {counterpart.translate('window.clearFilter.caption')}
                  <i className="meta-icon-trash" />
                </span>
              )}
            </div>
            <div className="form-group row filter-content">
              <div className="col-sm-12">
                {filter.parameters &&
                  filter.parameters.map((item, index) => (
                    <RawWidget
                      entity="documentView"
                      subentity="filter"
                      subentityId={filter.filterId}
                      handlePatch={this.setValue}
                      handleChange={this.setValue}
                      widgetType={item.widgetType}
                      fields={[item]}
                      type={item.type}
                      widgetData={[item]}
                      key={index}
                      id={index}
                      range={item.range}
                      caption={item.caption}
                      noLabel={false}
                      filterWidget={true}
                      {...{
                        viewId,
                        windowType,
                        onShow,
                        onHide,
                      }}
                    />
                  ))}
              </div>
              <div className="col-sm-12 text-xs-right">
                {notValidFields && (
                  <div className="input-error">
                    {counterpart.translate('window.noMandatory.caption')}
                  </div>
                )}
              </div>
            </div>
            <div className="filter-btn-wrapper">
              <TetherComponent
                attachment="top left"
                targetAttachment="bottom left"
                constraints={[
                  {
                    to: 'scrollParent',
                  },
                  {
                    to: 'window',
                    pin: ['bottom'],
                  },
                ]}
              >
                <button
                  className="applyBtn btn btn-sm btn-success"
                  onClick={this.handleApply}
                  onMouseEnter={() => this.toggleTooltip(true)}
                  onMouseLeave={() => this.toggleTooltip(false)}
                >
                  {counterpart.translate('window.apply.caption')}
                </button>
                {isTooltipShow && (
                  <Tooltips
                    className="filter-tooltip"
                    name={keymap.APPLY}
                    action={counterpart.translate('window.apply.caption')}
                    type={''}
                  />
                )}
              </TetherComponent>
            </div>
          </div>
        )}
        <ModalContextShortcuts apply={this.handleApply} />
      </div>
    );
  }
}

FiltersItem.propTypes = {
  dispatch: PropTypes.func.isRequired,
};

export default connect()(FiltersItem);
