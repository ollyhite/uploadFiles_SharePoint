import React, { useState } from "react";
import "./App.css";
import { Button, Card, Form, message, Skeleton, Space, Upload } from "antd";
import { InboxOutlined } from "@ant-design/icons";
import { SignInButton } from "./SignInButton";

function App() {
  const { Dragger } = Upload;
  const [fileList, setFileList] = useState([]);

  const handleFileRemove = (file) => {
    const newFileList = fileList.filter((f) => f.uid !== file.uid);
    setFileList(newFileList);
  };

  const handleBeforeUpload = (file) => {
    setFileList([...fileList, file]);
    return false; // Prevent automatic upload
  };

  // Remove unused handleFileChange to resolve the warning
  // const handleFileChange = ({ file, fileList }) => {
  //   setFileList(fileList);
  //   if (file.status === "done") {
  //     message.success(`${file.name} file uploaded successfully.`);
  //   } else if (file.status === "error") {
  //     message.error(`${file.name} file upload failed.`);
  //   }
  // };

  const uploadFile = async () => {
    const formData = new FormData();
    fileList.forEach((file) => {
      formData.append("files", file);
    });

    try {
      const response = await fetch(
        "http://localhost:8088/ext/NoteFilesUpload",
        {
          method: "POST",
          body: formData,
          headers: {
            // No need to manually set 'Content-Type' when sending FormData, it will be automatically set
          },
        }
      );

      if (response.ok) {
        message.success("File uploaded successfully.");
      } else {
        message.error("File upload failed.");
      }
    } catch (error) {
      console.error("Upload error:", error);
      message.error("File upload failed. Please try again.");
    }
  };

  const filesProps = {
    onRemove: handleFileRemove,
    beforeUpload: handleBeforeUpload,
    fileList: fileList,
  };

  return (
    <div className="App">
      <>
        <SignInButton />
        <Card title="Notes" type="inner" style={{ marginBottom: 22 }}>
          <Skeleton loading={false} active>
            <Form layout="horizontal" onFinish={uploadFile}>
              <Form.Item
                label="Files Upload"
                name="NOTE_FILES"
                colon={false}
                style={{ marginBottom: 6 }}
              >
                <Dragger {...filesProps}>
                  <p className="ant-upload-drag-icon">
                    <InboxOutlined />
                  </p>
                  <p className="ant-upload-text">
                    Click or drag file to this area to upload
                  </p>
                  <p className="ant-upload-hint">
                    Support for a single or bulk upload. Strictly prohibited
                    from uploading company data or other banned files.
                  </p>
                </Dragger>
              </Form.Item>
              <Form.Item>
                <div style={{ textAlign: "right" }}>
                  <Space>
                    <Button htmlType="submit" type="primary">
                      Upload
                    </Button>
                    <Button type="default" onClick={() => setFileList([])}>
                      Clear
                    </Button>
                  </Space>
                </div>
              </Form.Item>
            </Form>
          </Skeleton>
        </Card>
      </>
    </div>
  );
}

export default App;
