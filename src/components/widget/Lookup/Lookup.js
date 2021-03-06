import React, { Component } from 'react';
import onClickOutside from 'react-onclickoutside';
import { connect } from 'react-redux';
import classnames from 'classnames';

import { getItemsByProperty } from '../../../actions/WindowActions';
import BarcodeScanner from '../BarcodeScanner/BarcodeScannerWidget';
import List from '../List/List';
import RawLookup from './RawLookup';

class Lookup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      isInputEmpty: true,
      propertiesCopy: getItemsByProperty(props.properties, 'source', 'list'),
      property: '',
      fireClickOutside: false,
      initialFocus: false,
      localClearing: false,
      fireDropdownList: false,
      autofocusDisabled: false,
      isDropdownListOpen: false,
      isFocused: {},
    };
  }

  componentDidMount() {
    this.checkIfDefaultValue();
  }

  checkIfDefaultValue = () => {
    const { defaultValue } = this.props;

    if (defaultValue) {
      defaultValue.map(item => {
        if (item.value) {
          this.setState({
            isInputEmpty: false,
          });
        }
      });
    }
  };

  setNextProperty = prop => {
    const { defaultValue, properties, onBlurWidget } = this.props;

    if (defaultValue) {
      defaultValue.map((item, index) => {
        const nextIndex = index + 1;

        if (
          nextIndex < defaultValue.length &&
          defaultValue[index].field === prop
        ) {
          let nextProp = properties[nextIndex];

          // TODO: Looks like this code was never used
          if (nextProp.source === 'list') {
            this.linkedList.map(listComponent => {
              if (listComponent && listComponent.props) {
                let listProp = listComponent.props.mainProperty;

                if (
                  listProp &&
                  Array.isArray(listProp) &&
                  listProp.length > 0
                ) {
                  const listPropField = listProp[0].field;

                  if (
                    listComponent.activate &&
                    listPropField === nextProp.field
                  ) {
                    listComponent.requestListData(true, true);
                    listComponent.activate();
                  }
                }
              }
            });

            this.setState({
              property: nextProp.field,
            });
          } else {
            this.setState({
              property: nextProp.field,
            });
          }
        } else if (defaultValue[defaultValue.length - 1].field === prop) {
          this.setState(
            {
              property: '',
            },
            () => {
              onBlurWidget && onBlurWidget();
            }
          );
        }
      });
    }
  };

  openDropdownList = () => {
    this.setState(
      {
        fireDropdownList: true,
      },
      () => {
        this.setState({
          fireDropdownList: false,
        });
      }
    );
  };

  dropdownListToggle = value => {
    const { onFocus, onHandleBlur } = this.props;

    this.setState({
      isDropdownListOpen: value,
    });

    if (value && onFocus) {
      onFocus();
    } else if (!value && onHandleBlur) {
      onHandleBlur();
    }
  };

  resetLocalClearing = () => {
    this.setState({
      localClearing: false,
    });
  };

  handleClickOutside = () => {
    if (this.state.isDropdownListOpen) {
      this.setState(
        {
          fireClickOutside: true,
          property: '',
        },
        () => {
          this.setState({
            fireClickOutside: false,
          });
        }
      );
    }
  };

  handleInputEmptyStatus = isEmpty => {
    this.setState({
      isInputEmpty: isEmpty,
    });
  };

  handleClear = () => {
    const { onChange, properties, onSelectBarcode } = this.props;

    onChange && onChange(properties, null, false);
    onSelectBarcode && onSelectBarcode(null);

    this.setState({
      isInputEmpty: true,
      property: '',
      initialFocus: true,
      localClearing: true,
      autofocusDisabled: false,
    });
  };

  handleFocus = fieldName => {
    this.setState({
      isFocused: {
        ...this.state.isFocused,
        [`${fieldName}`]: true,
      },
    });
    this.props.onFocus();
  };

  handleBlur = fieldName => {
    this.setState({
      isFocused: {
        ...this.state.isFocused,
        [`${fieldName}`]: false,
      },
    });
    this.props.onHandleBlur();
  };

  getFocused = fieldName => {
    return !!this.state.isFocused[fieldName];
  };

  disableAutofocus = () => {
    this.setState({
      autofocusDisabled: true,
    });
  };

  enableAutofocus = () => {
    this.setState({
      autofocusDisabled: false,
    });
  };

  renderInputControls = showBarcodeScanner => {
    const { onScanBarcode } = this.props;
    const { isInputEmpty } = this.state;

    return (
      <div
        className="input-icon input-icon-lg raw-lookup-wrapper"
        onClick={isInputEmpty ? this.openDropdownList : null}
      >
        {showBarcodeScanner ? (
          <button
            className="btn btn-sm btn-meta-success btn-scanner"
            onClick={() => onScanBarcode(true)}
          >
            Scan using camera
          </button>
        ) : null}
        <i
          className={classnames({
            'meta-icon-close-alt': !isInputEmpty,
            'meta-icon-preview': isInputEmpty,
          })}
          onClick={!isInputEmpty ? this.handleClear : null}
        />
      </div>
    );
  };

  render() {
    const {
      rank,
      readonly,
      defaultValue,
      placeholder,
      align,
      isModal,
      updated,
      filterWidget,
      mandatory,
      rowId,
      tabIndex,
      validStatus,
      recent,
      onChange,
      newRecordCaption,
      properties,
      windowType,
      parameterName,
      entity,
      dataId,
      tabId,
      subentity,
      subentityId,
      viewId,
      autoFocus,
      newRecordWindowId,
      scanning,
      barcodeSelected,
      scannerElement,
      onHandleBlur,
      onFocus,
    } = this.props;

    const {
      isInputEmpty,
      property,
      fireClickOutside,
      initialFocus,
      localClearing,
      fireDropdownList,
      autofocusDisabled,
      isDropdownListOpen,
    } = this.state;

    this.linkedList = [];

    const mandatoryInputCondition =
      mandatory &&
      (isInputEmpty ||
        (validStatus && validStatus.initialValue && !validStatus.valid));
    const errorInputCondition =
      validStatus && (!validStatus.valid && !validStatus.initialValue);
    const classRank = rank || 'primary';
    let showBarcodeScannerBtn = false;

    if (scanning) {
      return (
        <div className="overlay-field js-not-unselect">{scannerElement}</div>
      );
    }

    return (
      <div
        ref={c => (this.dropdown = c)}
        className={classnames(
          'input-dropdown-container lookup-wrapper',
          `input-${classRank}`,
          {
            'pulse-on': updated,
            'pulse-off': !updated,
            'input-full': filterWidget,
            'input-mandatory': mandatoryInputCondition,
            'input-error': errorInputCondition,
            'lookup-wrapper-disabled': readonly,
          }
        )}
      >
        {properties &&
          properties.map((item, index) => {
            // TODO: This is really not how we should be doing this. Backend should send
            // us info which fields are usable with barcode scanner
            showBarcodeScannerBtn = item.field === 'M_LocatorTo_ID';
            const disabled = isInputEmpty && index !== 0;
            const itemByProperty = getItemsByProperty(
              defaultValue,
              'field',
              item.field
            )[0];
            if (
              item.source === 'lookup' ||
              item.widgetType === 'Lookup' ||
              (itemByProperty && itemByProperty.widgetType === 'Lookup')
            ) {
              let defaultValue = itemByProperty.value;

              if (barcodeSelected) {
                defaultValue = { caption: barcodeSelected };
              }

              return (
                <RawLookup
                  key={index}
                  defaultValue={defaultValue}
                  autoFocus={index === 0 && autoFocus}
                  initialFocus={index === 0 && initialFocus}
                  mainProperty={[item]}
                  resetLocalClearing={this.resetLocalClearing}
                  setNextProperty={this.setNextProperty}
                  lookupEmpty={isInputEmpty}
                  fireDropdownList={fireDropdownList}
                  handleInputEmptyStatus={this.handleInputEmptyStatus}
                  enableAutofocus={this.enableAutofocus}
                  onHandleBlur={onHandleBlur}
                  onHandleFocus={onFocus}
                  isOpen={isDropdownListOpen}
                  onDropdownListToggle={this.dropdownListToggle}
                  {...{
                    placeholder,
                    readonly,
                    tabIndex,
                    windowType,
                    parameterName,
                    entity,
                    dataId,
                    isModal,
                    recent,
                    rank,
                    updated,
                    filterWidget,
                    mandatory,
                    validStatus,
                    align,
                    onChange,
                    item,
                    disabled,
                    fireClickOutside,
                    viewId,
                    subentity,
                    subentityId,
                    tabId,
                    rowId,
                    newRecordCaption,
                    newRecordWindowId,
                    localClearing,
                  }}
                />
              );
            } else if (
              item.source === 'list' ||
              item.widgetType === 'List' ||
              (itemByProperty && itemByProperty.source === 'List')
            ) {
              const isFirstProperty = index === 0;
              const isCurrentProperty =
                item.field === property && !autofocusDisabled;

              return (
                <div
                  key={item.field}
                  className={classnames(
                    'raw-lookup-wrapper raw-lookup-wrapper-bcg',
                    {
                      'raw-lookup-disabled': disabled || readonly,
                      focused: this.getFocused(item.field),
                    }
                  )}
                >
                  <List
                    ref={c => {
                      if (c) {
                        this.linkedList.push(c.getWrappedInstance());
                      }
                    }}
                    clearable={false}
                    readonly={disabled || readonly}
                    lookupList={true}
                    autoFocus={isCurrentProperty}
                    doNotOpenOnFocus={false}
                    properties={[item]}
                    mainProperty={[item]}
                    defaultValue={
                      itemByProperty.value ? itemByProperty.value : ''
                    }
                    initialFocus={isFirstProperty ? initialFocus : false}
                    blur={!property ? true : false}
                    setNextProperty={this.setNextProperty}
                    disableAutofocus={this.disableAutofocus}
                    enableAutofocus={this.enableAutofocus}
                    onFocus={() => this.handleFocus(item.field)}
                    onHandleBlur={() => this.handleBlur(item.field)}
                    {...{
                      dataId,
                      entity,
                      windowType,
                      filterWidget,
                      tabId,
                      rowId,
                      subentity,
                      subentityId,
                      viewId,
                      onChange,
                      isInputEmpty,
                      property,
                    }}
                  />
                </div>
              );
            }
          })}

        {!readonly && this.renderInputControls(showBarcodeScannerBtn)}
      </div>
    );
  }
}

export default connect()(BarcodeScanner(onClickOutside(Lookup)));
