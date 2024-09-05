import { Menu as AntdMenu } from "antd";
import { FC } from "react";
import { ContextMenuEvent } from "reagraph";
import styled from "styled-components";

const Menu = styled(AntdMenu)`
    position: relative;
    right: -150px;
    border-radius: 10px;
`;

interface NodeContextMenuProps {
    data: any;
    onClose: () => void;
    onExpandAddress: (address: string) => void;
}

const NodeContextMenu: FC<NodeContextMenuProps> = (props: NodeContextMenuProps) => {
    const { data, onClose, onExpandAddress } = props;
    console.log('data', props);

    const handleCopyAddress = () => {
        navigator.clipboard.writeText(data.id);
        onClose();
    }

    const handleExpandAddress = () => {
        onExpandAddress(data.id);
        onClose();
    }

    const handleViewDetails = () => {
        // TODO: Implement
        console.log('view details', data);
        onClose();
    }

    return (
      <Menu
        theme="dark"
      >
        <Menu.Item key="copy" onClick={handleCopyAddress}>Copy Address</Menu.Item>
        <Menu.Item key="explore" onClick={handleExpandAddress}>Explore This Address</Menu.Item>
        <Menu.Item key="details" onClick={handleViewDetails}>View Details</Menu.Item>
      </Menu>
    );
  };

export default NodeContextMenu;