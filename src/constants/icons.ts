import home from '@/assets/icons/home.svg';
import packer from '@/assets/icons/packer.svg';
import picker from '@/assets/icons/picker.svg';
import profile from '@/assets/icons/profile.svg';
import dispatch from '@/assets/icons/Dispatch.svg';
import arrowForward from '@/assets/icons/arrow_forward.svg';
import keyboardDoubleArrowRight from '@/assets/icons/keyboard_double_arrow_right.svg';
import hourglassTop from '@/assets/icons/hourglass_top.svg';
import search from '@/assets/icons/search.svg';
import search_dark from '@/assets/icons/search_dark.svg';
import swapVert from '@/assets/icons/swap_vert.svg';
import person from '@/assets/icons/person.svg';
import creditCardClock from '@/assets/icons/credit_card_clock.svg';
import checkCircle from '@/assets/icons/check_circle.svg';
import arrowBack from '@/assets/icons/arrow_back.svg';
import info from '@/assets/icons/info.svg';
import print from '@/assets/icons/print.svg';
import edit from '@/assets/icons/edit.svg';
import shift from '@/assets/icons/shift.svg';
import info_warn from '@/assets/icons/info_warn.svg';
import clock_loader from '@/assets/icons/clock_loader.svg';
import pill from '@/assets/icons/pill.svg';
import editor_choice from '@/assets/icons/editor_choice.svg';
import packageIcon from '@/assets/icons/package.svg';
import calendar_clock from '@/assets/icons/calendar_clock.svg';
import calendar_month from '@/assets/icons/calendar_month.svg';
import drafts from '@/assets/icons/drafts.svg';
import logout from '@/assets/icons/logout.svg';
import scan_icon from '@/assets/icons/scan_icon.svg';
import success from '@/assets/icons/success.svg';
import scan from '@/assets/icons/scan.svg';
import checkmarkPure from '@/assets/icons/checkmark_pure.svg';
import refresh from '@/assets/icons/refresh.svg';
import arrow_drop_down from '@/assets/icons/arrow_drop_down.svg';
import arrow_down from '@/assets/icons/arrow_down.svg';
import arrow_up from '@/assets/icons/arrow_up.svg';
import calendar_today from '@/assets/icons/calendar_today.svg';
import local_shipping from '@/assets/icons/local_shipping.svg';
import cancel from '@/assets/icons/cancel.svg';
import adf_scanner from '@/assets/icons/adf_scanner.svg';

export const icons = {
    home,
    picker,    // Use picker.svg for Orders tab
    checker: packer, // Alias for Checker tab
    packer,  // Use packer.svg for Referral tab
    profile,
    dispatch,
    arrowForward,
    keyboardDoubleArrowRight,
    hourglassTop,
    search,
    search_dark,
    swapVert,
    person,
    creditCardClock,
    checkCircle,
    checkmarkPure,
    arrowBack,
    info,
    print,
    edit,
    shift,
    info_warn,
    clock_loader,
    pill,
    editor_choice,
    package: packageIcon,
    calendar_clock,
    calendar_month,
    drafts,
    logout,
    scan_icon,
    success,
    scan,
    refresh,
    arrow_drop_down,
    arrow_down,
    arrow_up,
    calendar_today,
    local_shipping,
    cancel,
    adf_scanner,
} as const;

export type IconKey = keyof typeof icons;